import { generateReferralKey, isRefferalKeyUnique } from "../Utils/referral.js";

import {
  InvalidId,
  accActivatedSub,
  accountActivated,
  accountCreated,
  alreadyActive,
  columnUpdated,
  deleted,
  fetched,
  forgetPasswordContent,
  invalidLoginCred,
  invalidOtp,
  limitCrossed,
  loggedIn,
  loginOtp,
  notExist,
  notVerified,
  otPSentForPass,
  otpSent,
  otpSentSub,
  registered,
  serverError,
  tryAgain,
  unauthorized,
  userActivated,
  InvalidEmail,
} from "../Utils/Messages.js";
import { options } from "../Utils/Mailer.js";
import collections from "../Utils/Collection.js";
import jwt from "jsonwebtoken";
import Settings from "../Controllers/Settings.js";
import UserModel from "../Models/Users.js";
import { ObjectId } from 'mongodb';
import Auth from "../Utils/Middlewares.js";
// Models
const userModel = new UserModel();
const settings = new Settings();
const Authenication=new Auth();
class Admin {
  constructor() {
  }

  async getUsers(id, page, limit) {
    let skip = parseInt(page) * limit;
    try {
      const users = await collections
        .adminCollection()
        .find({ id: { $ne: id }, type: { $ne: "super-admin" } })
        .skip(skip)
        .limit(limit)
        .toArray();

      if (users.length > 0) {
        return {
          ...fetched("Staff"),
          data: users,
        };
      }
      return notExist("Staff");
    } catch (err) {
      console.log(err);
      return serverError;
    }
  }

  // Complete login controller
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await collections.adminCollection().findOne({
        email: email.toLowerCase()
      });

      if (result && (result.email === email)) {
        if (result.attempt > 0) {
          const comparedPassword = await ComparePassword(password, result.password);
          console.log(comparedPassword)
          if (comparedPassword) {
            if (result.attempt < 5) {
              await collections.adminCollection().updateOne(
                { id: result.id },
                { $set: { attempt: 5 } }
              );
            }
            const token = jwt.sign({ id: result._id.toString() }, process.env.JWT_SECRET, { expiresIn: "1d" });
            return res.status(loggedIn.status || 200).send({
              ...loggedIn,
              type: result.type,
              data: { id: result.id, token: token }
            });
          } else {
            await collections.adminCollection().updateOne(
              { id: result.id },
              { $inc: { attempt: -1 } }
            );
            return res.status(invalidLoginCred().status).send({
              ...invalidLoginCred(result.attempt - 1),
              remainingAttempts: parseInt(result.attempt - 1),
            });
          }
        } else {
          return res.status(limitCrossed.status || 429).send(limitCrossed);
        }
      } else {
        return res.status(InvalidEmail("User").status || 404).send(InvalidEmail("User"));
      }
    } catch (error) {
      console.error(error);
      return res.status(serverError.status || 500).send(serverError);
    }
  }

  // Static new user controller
  async addUser(user) {
    let referralKey = generateReferralKey();
    while (!await isReferralKeyUnique(referralKey)) {
      referralKey = generateReferralKey(); // Keep generating until it's unique
    }
    user.referral_key = referralKey; // Set the referral_key on the user

    const res = await collections.adminCollection().insertOne(user);
    if (res.acknowledged && res.insertedId) {
      // Send email to the new user
      let mailOption = options(
        user.email,
        `Welcome to Kno-one!`,
        accountCreated(user.id, user.fullName)
      );
      await transponder.verify();
      await sendMail(mailOption);

      // Return success response with 'id'
      let message = registered(user?.id, user?.email);
      return {
        ...message,
        data: {
          id: user.id,
          referral_key: user.referral_key
        },
      };
    } else {
      return tryAgain;
    }
  }

  async registerAdmin(body) {
    try {
      // Use AdminModel instead of UserModel
      const user = UserModel.fromJson(body);

      // Generate referral_key and ensure it's unique
      let referralKey = generateReferralKey();
      while (!await isRefferalKeyUnique(referralKey)) {
        referralKey = generateReferralKey();
      }
      user.referral_key = referralKey;
      const hashedPassword = await Authenication.hashPassword(user.password);
      user.password = hashedPassword;

      const result = await collections.admins().insertOne(user.toDatabaseJson());

      if (result.acknowledged && result.insertedId) {
        user.id = result.insertedId.toString();
        let mailOption = options(
          user.email,
          `Welcome to Heasey!`,
          accountCreated(user.id, user.fullName)
        );
        // await transponder.verify();
        // await sendMail(mailOption);

        let message = registered(user?.id, user?.email);
        return {
          ...message,
          data: {
            id: user.id,
            referral_key: user.referral_key
          },
        };
      } else {
        return tryAgain;
      }
    } catch (error) {
      console.log(error);
      return serverError;
    }
  }

  // activateAccount
  async activate(id) {
    try {
      const user = await collections
        .adminCollection()
        .findOneAndUpdate(
          { id: id },
          { $set: { isVerified: true, status: true } },
          { returnDocument: "before" }
        );
      if (user && user?.isVerified) {
        return alreadyActive;
      }
      if (user) {
        let option = options(user.email, accActivatedSub, accountActivated(user.id, user.fullName));
        await sendMail(option);
        return userActivated;
      }
      else {
        return tryAgain;
      }
    } catch (err) {
      return serverError;
    }
  }

  // Send credentials via mail controller
  async sendOtp(id) {
    try {
      let value = id.toLowerCase();
      let query = {
        $or: [{ email: value }]
      };

      // Check if the id is a valid ObjectId
      if (value.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: new ObjectId(value) });
      }

      const result = await collections.adminCollection().findOne(query);

      if (result) {
        if (result.attempt == 0) {
          return limitCrossed;
        }

        const { email, phone, fullName, _id } = result;

        function generateOTP() {
          const otp = Math.floor(100000 + Math.random() * 900000);
          return otp.toString();
        }

        let otp = generateOTP();
        console.log(otp);

        await collections.veriCollection().insertOne({
          otp: otp,
          id: _id.toString(), // Convert ObjectId to string
          createdAt: new Date(),
        });

        await collections.veriCollection().createIndex(
          {
            createdAt: 1,
          },
          {
            expireAfterSeconds: 60 * 5,
          }
        );

        let mailOption = options(
          email,
          otpSentSub,
          loginOtp(_id.toString(), otp, fullName)
        );

        await transponder.verify();
        await sendMail(mailOption);

        return { ...otpSent, data: { id: _id.toString() } };
      } else {
        return InvalidId("user");
      }
    } catch (err) {
      console.log(err);
      return serverError;
    }
  }


  //   Verify ADMIN OTP Controller
  async verifyOtp(req, res) {
    try {
      const otp = req.body?.otp;
      const verify = await collections.veriCollection().findOne({
        otp: otp,
      });

      if (verify && (verify.id === req.body?.id || verify.id === req.body?.email)) {
        const result = await collections.adminCollection().findOne({
          $or: [{ id: verify.id }, { email: verify.id }],
        });

        let user = new UserModel().fromJson(result);
        const token = jwt.sign(
          {
            id: user.id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1d",
          }
        );
        res.cookie("id", user.id, {
          httpOnly: true,
          maxAge: 1 * 24 * 60 * 60 * 1000,
          secure: true, // Set to false for local development
          sameSite: "strict",
        });

        return res
          .status(loggedIn.status)
          .cookie("authToken", token, {
            httpOnly: true,
            maxAge: 1 * 24 * 60 * 60 * 1000,
            secure: true, // Set to false for local development
            sameSite: "strict",
          })
          .send({
            ...loggedIn,
            data: {
              token: token,
              id: user.id
            },
          });
      } else {
        return res.status(invalidOtp.status).send(invalidOtp);
      }
    } catch (err) {
      console.log(err);
      return res.status(serverError.status).send(serverError);
    }
  }

  // Get User by user Id controller
  async getUserById(id) {
    try {
      const [user, countUsers, countConn, totalStorageResult, withdrawTransactionCount] = await Promise.all([
        collections.adminCollection().find({ id: id }).toArray(),
        collections.userCollection().countDocuments({ status: true }),
        collections.connCollection().countDocuments({ status: true }),
        collections.connCollection().aggregate([
          { $match: { status: true } },
          { $group: { _id: null, totalStorage: { $sum: "$storage" } } }
        ]).toArray(),
        collections.transCollection().countDocuments({
          type: "withdraw",
          status: false
        })
      ]);

      const totalStorage = totalStorageResult.length > 0 ? totalStorageResult[0].totalStorage : 0;

      if (user && user.length > 0) {
        const newUser = UserModel.fromJson(user[0]).toClientJson();
        return {
          ...fetched("Your"),
          data: {
            ...newUser,
            id: id,
            users: countUsers,
            // storage: totalStorage,
            // connections: countConn,
            // withdrawRequest: withdrawTransactionCount
          }
        };
      } else {
        return InvalidId("User");
      }
    } catch (err) {
      console.log(err);
      return serverError;
    }
  }


  // Send credentials via mail controller
  async forgetPass(id, password) {
    try {
      let value = id.toLowerCase();
      const result = await collections.adminCollection().findOne({ $or: [{ id: value }, { email: value }] });
      if (result && result?.isVerified) {
        const hashedPassword = await HashPassword(password);
        const { email, fullName } = result;
        function generateOTP() {
          const otp = Math.floor(100000 + Math.random() * 900000);
          return otp.toString();
        }

        let otp = generateOTP();
        await collections.veriCollection().insertOne({
          otp: otp,
          id: value,
          password: hashedPassword,
          createdAt: new Date(),
        });
        await collections.veriCollection().createIndex(
          {
            createdAt: 1,
          },
          {
            expireAfterSeconds: 60 * 5,
          }
        );

        let mailOption = options(
          email,
          "Reset Password Authenication!",
          forgetPasswordContent(id, otp, fullName)
        );
        await transponder.verify();
        await sendMail(mailOption);
        return otPSentForPass;
      } else {
        return InvalidId("user");
      }
    } catch (err) {
      return serverError
    }
  }

  // Update user by id
  async updateUser(body) {
    try {
      const { id } = body;
      const user = new UserModel().toUpdateJson(body);

      const result = await collections.adminCollection().updateOne(
        { id: id },
        { $set: { ...user } }
      );
      if (result.acknowledged && result.modifiedCount > 0) {
        return columnUpdated("Your account");
      } else {
        return InvalidId("User");
      }
    } catch (err) {
      console.log(err);
      return serverError;
    }
  }

  // change profile pic controller
  async changePhoto(id, photo) {
    try {
      const fileData = {
        type: photo?.mimetype ?? "",
        file: photo?.buffer?.toString("base64") ?? "",
      };
      const result = await collections.adminCollection().updateOne(
        {
          id: id,
        },
        {
          $set: {
            image: fileData,
          },
        }
      );
      if (result.acknowledged && result.modifiedCount > 0) {
        return columnUpdated("Your Profile Photo");
      }
      else {
        return tryAgain;
      }
    } catch (err) {
      return serverError;
    }
  }

  // Change Password controller
  async changePassword(body) {
    try {
      const { otp, id } = body;
      const result = await collections.veriCollection().findOne({
        otp: otp,
      });

      if (result && result?.id === id) {
        let value = id.toLowerCase();
        const setResult = await collections.adminCollection().updateOne(
          { $or: [{ id: value }, { email: value }] },
          {
            $set: {
              password: result?.password,
            },
          }
        );
        if (setResult?.acknowledged && setResult?.modifiedCount > 0) {
          return columnUpdated("Your Password");
        }
        else {
          return tryAgain;
        }
      }
      else {
        return invalidOtp;
      }
    } catch (err) {

      return serverError;
    }
  }

  //   Delete Admin controller
  async deleteUsers(id) {
    try {
      const result = await collections.adminCollection().deleteOne({
        id: id,
      });
      if (result && result.deletedCount > 0) {
        return {
          ...deleted("Staff"),
        };
      } else {
        return InvalidId("Staff");
      }
    } catch (err) {
      return serverError;
    }
  }


}

export default Admin;
