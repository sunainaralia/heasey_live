import collections from "../Utils/Collection.js";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { attemptLeft, found, invalidId, loggedIn, serverError, tryAgain, unauthorized, registered, invalidLoginCred, otpSent, invalidOtp, uploadError, columnUpdated, unauthorizedLogin, fetched, notFound, invalidCurrentPassword, passwordUpdated, failedToUpdate, productLiked, limitCrossed } from "../Utils/Messages.js";
import UserModel from "../Models/Users.js";
import settingsModel from "../Models/Settings.js";
import Auth from "../Utils/Middlewares.js";
import { isRefferalKeyUnique, generateReferralKey } from "../Utils/referral.js";
import NotificationModel from "../Models/Notifications.js";
import DeductionModel from "../Models/Deduction.js";
import { newRef } from "../Utils/Notifications.js";
import Notifications from "./Notifications.js";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { sendMail, options } from "../Utils/Mailer.js";
import fs from 'fs';
import path from "path";
import bcrypt from 'bcrypt';
import IncomeModel from "../Models/Incomes.js";
import { readFile } from "../Utils/FileReader.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const notifications = new Notifications();
class Users {
  async getUsers(page, limit) {
    const skip = parseInt(page) * limit;
    try {
      const [users, count] = await Promise.all([
        collections.users().find().skip(skip).limit(limit * 10).toArray(),
        collections.users().countDocuments()
      ]);

      if (users.length > 0) {
        users.forEach(user => {
          if (user.image) {
            user.image = readFile(user.image) ?? "";
          }
        });
        let message = found("Users");
        return {
          message,
          data: users,
          length: count
        };
      }

      let message = notFound("Users");
      return { message };
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }
  // send otp 
  async sendOtp(id) {
    try {
      let value = id;
      const result = await collections.users().findOne({
        $or: [{ phone: value }, { email: value.toLowerCase() }]
      });

      if (!result || ((result.email.toLowerCase() != value) && (result.phone != value))) {
        return invalidId("user");
      }

      const { email, fullName, _id, canLogin, phone } = result;
      if (!canLogin) {
        if (email === value.toLowerCase()) {
          return unauthorizedLogin("email")
        } else if (phone === value) {
          return unauthorizedLogin("phone")
        }
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in database
      await collections.veriCollection().insertOne({
        otp,
        userId: _id,
        status: true,
        createdAt: new Date(),
      });

      // Create expiry index
      await collections.veriCollection().createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 60 * 5 }
      );
      const mailOption = options(
        email,
        "Your Heasey OTP",
        `Hi ${fullName},<br><br>
             Your Heasey Authentication OTP is ${otp}.<br>
             Please don't share this OTP with anyone.<br><br>
             Thanks & Regards,<br>
             Heasey(Health made easy)`
      );


      const emailResult = await sendMail(mailOption);
      if (!emailResult.success) {
        return notFound("Email")
      }
      console.log(otp)

      return { ...otpSent, data: { userId: _id } };

    } catch (err) {
      console.error('Error in sendOtp:', err);
      return serverError;
    }
  }
  // verify otp
  async verifyOtp(req, res) {
    try {
      let otp = req.body?.otp;
      let userId = req.body?.userId.toLowerCase();
      const verify = await collections.veriCollection().findOne({
        otp: otp,
      });
      if (verify && verify.userId) {
        let objectIdQuery = null;
        if (ObjectId.isValid(userId)) {
          objectIdQuery = new ObjectId(userId);
        }
        const user = await collections.users().findOne({
          $or: [{
            _id: objectIdQuery,
          }, { email: userId }]
        });
        if (user && user._id.toString() == verify.userId.toString()) {
          const token = jwt.sign(
            {
              id: user._id,
            },
            process.env.JWT_SECRET,
            {
              expiresIn: "1d",
            }
          );
          res.cookie("userId", user._id, {
            httpOnly: true,
            maxAge: 1 * 24 * 60 * 60 * 1000,
            secure: true,
            sameSite: "strict",
          });

          return res
            .status(loggedIn.status)
            .cookie("authToken", token, {
              httpOnly: true,
              maxAge: 1 * 24 * 60 * 60 * 1000,
              secure: true,
              sameSite: "strict",
            })
            .send({
              ...loggedIn,
              data: {
                token: token,
                userId: user._id
              },
            });
        }
        else {
          return tryAgain;
        }
      } else {
        return invalidOtp;
      }
    } catch (err) {
      return serverError;
    }
  }

  // Complete login controller
  async login(req, res) {
    try {
      const { userId, password } = req.body;
      const value = userId.toLowerCase();
      const objectIdQuery = ObjectId.isValid(value) ? new ObjectId(value) : null;

      const result = await collections.users().findOne({
        $or: [
          { _id: objectIdQuery },
          { email: value }
        ],
      });

      if (!result) {
        const msg = invalidId("User");
        return msg;
      }
      const user = new UserModel().fromJson(result);

      if (user.attempt <= 0) {
        return limitCrossed;
      }

      const isPasswordCorrect = await new Auth().ComparePassword(password, user.password);

      if (!isPasswordCorrect) {
        await collections.users().updateOne({ _id: user._id }, { $inc: { attempt: -1 } });
        const message = invalidLoginCred(user.attempt - 1);
        return message;
      }

      // Password is correct
      if (user.attempt < 5) {
        await collections.users().updateOne({ _id: user._id }, { $set: { attempt: 5 } });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Set cookies
      res.cookie('userId', user._id.toString(), {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: 'strict',
      });
      res.cookie('authToken', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: 'strict',
      });
      if ((user.level > 0) && (user.sponsorId)) {
        return {
          status: 200,
          message: "Login successful",
          data: {
            token: token,
            userId: user._id,
            member: true,
            sponsorId: user.sponsorId,
            referalId: user.referralId
          },
        };
      } else {
        return {
          status: 200,
          message: "Login successful",
          data: {
            token: token,
            userId: user._id,
            member: false,
            sponsorId: "",
            referalId: user.referralId
          },
        };
      }

    } catch (error) {
      console.error("Error in login:", error);
      return res.status(serverError.status).send(serverError);
    }
  }

  // check sponsoer user
  async getSponsorInfo(sponsorId, type) {
    try {
      if (type == "individual") {
        const user = await collections.users().findOne({
          referralId: sponsorId
        });
        return user;
      } else {
        const admin = await collections.admins().findOne({
          referralId: sponsorId
        })
        return admin;
      }
    } catch (err) {
      console.error("Error in getSponsorInfo:", err);
      return null;
    }

  }
  // add user
  async addUser(user) {
    const res = await collections.users().insertOne(user);
    if (res.acknowledged && res.insertedId) {
      if (parseInt(user.level) > 0) {
        await notifications.newNotification(newRef(user.sponsorId, user._id));
        let message = registered(user?._id, user?.email);
        return {
          ...message,
          data: {
            user
          }
        }
      };
      let message = registered(user?._id, user?.email);
      return {
        ...message,
        data: {
          user
        }
      }
    }

  }
  // register user
  async register(body) {
    const user = new UserModel().fromJson(body);
    try {
      const userTypeSettings = await collections.settings().findOne({
        title: "users-types",
        status: true
      });
      if (!userTypeSettings) {
        return tryAgain
      }
      const settingModel = settingsModel.fromJson(userTypeSettings);
      const allowedUserType = settingModel.value.split(',').map(type => type.trim());
      if (user.type != null) {
        if (!allowedUserType.includes(user.type)) {
          return unauthorized;
        };
      }
      const hashedPassword = new Auth().hashPassword(user.password);
      user.password = await hashedPassword;
      let referralId = generateReferralKey();
      while (!isRefferalKeyUnique(referralId)) {
        referralId = generateReferralKey()
      };
      user.referralId = referralId;
      let sponsorId = user.sponsorId;
      if (sponsorId) {
        let sponsorUser = await this.getSponsorInfo(sponsorId, user.type);
        if (!sponsorUser || !sponsorUser.referralId) {
          sponsorUser = await this.getSponsorInfo(sponsorId, "admin");
          if (!sponsorUser || !sponsorUser.status) {
            return invalidId("Sponsor");
          }
        }
        if (!sponsorUser?.status) {
          return invalidId("Sponsor");
        }
        let newLevel = Number(sponsorUser.level) + 1;
        user.level = newLevel;
      } else {
        user.level = 0
      }
      let res = await this.addUser(user.toDatabaseJson());
      return res;

    } catch (error) {
      console.error("Registration error:", error);
      return {
        ...serverError, error
      }
    }
  }
  // update user image
  async changePhoto(id, photo) {
    try {
      const userFolder = path.join(__dirname, '../', 'uploads', id);
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }
      const photoPath = path.join(userFolder, photo.originalname);
      fs.writeFileSync(photoPath, photo.buffer);
      const result = await collections.users().updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            image: photoPath,
          },
        }
      )
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
  // update user
  async updateUser(req, res) {
    try {
      const userId = req.body.userId;
      if (!ObjectId.isValid(userId)) {
        const msg = invalidId("User");
        return msg;
      };
      const user = await collections.users().findOne({ _id: new ObjectId(userId) });
      if (!user) {
        const msg = invalidId("User");
        return msg;
      };
      const updatedFields = new UserModel().toUpdateJson(req.body);
      const result = await collections.users().updateOne(
        { _id: new ObjectId(userId) },
        { $set: updatedFields }
      );

      if (result.modifiedCount > 0) {
        const msg = columnUpdated("User");
        return { ...msg, data: (result) };
      } else {
        const msg = tryAgain;
        return msg;
      }
    } catch (err) {
      console.error("Error in updateUser:", err);
      const msg = serverError;
      return msg;
    }
  }
  // get user by id
  async getUserById(id) {
    try {
      const value = id.toLowerCase();

      // Use Promise.all to fetch all data in parallel
      const [user, kyc, unread] = await Promise.all([
        collections.users().findOne({ _id: new ObjectId(value) }),
        // collections.notifCollection().countDocuments({ userId: value, status: false }),
      ]);

      if (user) {
        const newUser = new UserModel().fromJson(user).toClientJson();
        if (newUser.image) {
          newUser.image = readFile(user?.image) ?? "";
        }
        if (kyc) {
          kyc.aadharFile = [
            readFile(kyc?.aadharFile?.[0]) ?? "",
            readFile(kyc?.aadharFile?.[1]) ?? "",
          ];
          kyc.panFile = readFile(kyc?.panFile);
          kyc.sign = readFile(kyc?.sign) ?? "";
        }

        return {
          ...fetched("Your"),
          data: {
            user: newUser,
            kyc: kyc,
            // unread: unread,
          },
        };
      } else {
        return idNotFound;
      }
    } catch (err) {
      console.error(err);
      return serverError;
    }
  };
  // Get User Members
  async getMembers(userId) {
    try {
      const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
      if (!userObjectId) {
        return invalidId("User");
      }

      // Find the user in the database
      const user = await collections.users().findOne({ _id: userObjectId });
      if (!user) {
        return notFound("User");
      }

      // Fetch all team members using $graphLookup (recursively fetching referrals)
      const members = await collections.users().aggregate([
        {
          $match: { _id: userObjectId }
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$referralId",
            connectFromField: "referralId",
            connectToField: "sponsorId",
            as: "teamMembers",
            maxDepth: 1000,
            depthField: "hierarchyLevel"
          }
        }
      ]).toArray();

      if (!members.length || !members[0]?.teamMembers) {
        return notFound("TeamMembers");
      }

      let team = members[0]?.teamMembers || [];

      // Update member count for the user
      await collections.users().updateOne(
        { _id: userObjectId },
        { $set: { memberCount: team.length } }
      );

      // Format the response using the UserModel class
      let users = team.map((e) => {
        e.image = e.image ? readFile(e.image) : e.image;
        return new UserModel().toMemberJson(e)
      });
      user.image = user.image ? readFile(user.image) : "";

      return {
        status: 200,
        message: "Team members retrieved successfully",
        data: [...users, user],
        referralId: user.referralId
      };

    } catch (error) {
      console.error("Error in getMembers:", error);
      return serverError;;
    }
  }
  // change password
  async changePassword(body) {
    try {
      const { oldPassword, password, userId } = body;
      let value = userId.toLowerCase();

      // First, fetch the user to verify old password
      const existingUser = await collections.users().findOne({
        $or: [{ _id: new ObjectId(value) }, { email: value }]
      });

      if (!existingUser) {
        return notExist("User");
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);

      if (!isOldPasswordValid) {
        return invalidCurrentPassword;
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update with new password
      const user = await collections.users().findOneAndUpdate(
        { $or: [{ _id: new ObjectId(value) }, { email: value }] },
        {
          $set: {
            password: hashedPassword,
          },
        },
        { returnDocument: "after" }
      );

      if (user && user.password) {
        return passwordUpdated;
      } else {
        return failedToUpdate;
      }
    } catch (err) {
      return serverError;
    }
  }
  // verify otp and reset password
  async resetPassword(req, res) {
    try {
      let userId = req.body?.userId.toLowerCase();
      let newPassword = req.body?.newPassword;
      let confirmPassword = req.body?.confirmPassword;

      if (newPassword !== confirmPassword) {
        return res.status(400).send({ status: 400, message: "Password and confirmPassword do not match. Try again." });
      }

      let objectIdQuery = null;
      if (ObjectId.isValid(userId)) {
        objectIdQuery = new ObjectId(userId);
      }

      const user = await collections.users().findOne({
        $or: [{ _id: objectIdQuery }, { email: userId }]
      });

      if (!user) {
        return res.status(notFound("User").status).send(notFound("User"));
      }

      // Hash the new password using bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password in the database
      await collections.users().updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("userId", user._id, {
        httpOnly: true,
        maxAge: 1 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: "strict",
      });

      return res
        .status(200)
        .cookie("authToken", token, {
          httpOnly: true,
          maxAge: 1 * 24 * 60 * 60 * 1000,
          secure: true,
          sameSite: "strict",
        })
        .send({
          status: 200,
          message: "Password reset successfully",
          data: {
            token: token,
            userId: user._id
          },
        });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(serverError.status).send(serverError);
    }
  }
  // update user income
  async updateUsersIncome(req, res) {
    const session = client.startSession();
    let result = false;
    const { orderId } = req.body;

    try {
      session.startTransaction();
      let order = await collections.orders().findOneAndUpdate(
        { _id: new ObjectId(orderId), type: "confirmed" },
        { $set: { status: true } },
        { returnDocument: "before", session }
      );

      if (!order) return tryAgain;

      const amount = order?.amount;
      const [user, distributions, tdsSetting, convienceSetting] = await Promise.all([
        collections.users().findOne(
          { _id: new ObjectId(order?.userId) },
          { session }
        ),
        collections.distribution().find({ status: true }).sort({ level: 1 }).toArray(),
        collections.settings().findOne({ type: "tds" }),
        collections.settings().findOne({ type: "convenience" })
      ]);

      let gst = 0, convenience = 0, tds = 0
      gst = order?.taxValue;
      const amountAfterGst = amount - gst;

      if (tdsSetting?.value) {
        tds = (amountAfterGst * tdsSetting.value) / 100;
        let deduction = new DeductionModel(null, order.userId, "", "tds", tds, false, new Date(), new Date());
        let tdsResult = await collections.deduction().insertOne(deduction.toDatabaseJson(), { session });

        if (!tdsResult.insertedId) {
          await session.abortTransaction();
          return tryAgain;
        }
      }

      const amountAfterTds = amountAfterGst - tds;

      if (convienceSetting?.value) {
        convenience = (amountAfterTds * convienceSetting.value) / 100;
        let deduction = new DeductionModel(null, order.userId, "", "convenience", convenience, false, new Date(), new Date());
        let convenienceResult = await collections.deduction().insertOne(deduction.toDatabaseJson(), { session });

        if (!convenienceResult.insertedId) {
          await session.abortTransaction();
          return tryAgain;
        }
      };

      const amountToRelease = amountAfterTds - convenience;
      let currentSponsorId = user.sponsorId;
      let i = 1;

      // ----> UPDATE USER'S UNLOCK PROPERTY BASED ON PURCHASES <----
      let directReferralPurchases = await collections.orders().aggregate([
        { $match: { sponsorId: currentSponsorId, status: true } },
        { $group: { _id: null, totalAmountSpent: { $sum: "$amount" } } }
      ], { session }).toArray();

      if (directReferralPurchases.length > 0 && directReferralPurchases[0].totalAmountSpent) {
        // let newUnlockLevel = Math.floor(directReferralPurchases[0].totalAmountSpent / minimumPurchase);
        let newUnlockLevel = 16;
        let updatedUnlockLevel = newUnlockLevel > 16 ? 16 : newUnlockLevel;
        let updateUnlock = await collections.users().updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { unlocked: updatedUnlockLevel, updatedAt: new Date() } },
          { session }
        );

        if (!updateUnlock.modifiedCount) {
          await session.abortTransaction();
          return tryAgain;
        }
      }

      while (i <= 16 && currentSponsorId) {
        let sponsor = await collections.users().findOne({ _id: new ObjectId(currentSponsorId) }, { session });

        if (!sponsor) break;

        let distributionRate = distributions.find(e => i === parseInt(e.level))?.rate ?? 0;
        let levelIncome = parseFloat((amountToRelease * distributionRate) / 100);

        if (sponsor.unlocked >= i) {
          await collections.users().updateOne(
            { _id: new ObjectId(sponsor._id) },
            {
              $inc: {
                wallet: levelIncome,
                totalEarn: levelIncome
              },
              $set: { updatedAt: new Date() }
            },
            { session }
          );

          let newIncomeLog = new IncomeModel(
            null,
            order.userId,
            sponsor._id,
            i,
            "referral_income",
            levelIncome,
            true,
            new Date(),
            new Date()
          );

          let incomeLogResult = await collections.incomes().insertOne(newIncomeLog.toDatabaseJson(), { session });

          if (!incomeLogResult.insertedId) {
            result = false;
            break;
          }
        }

        if (sponsor.level === 0) {
          result = true;
          break;
        }
        currentSponsorId = sponsor.sponsorId;
        i++;
      }

      if (result) {
        await session.commitTransaction();
        return incomeActivate;
      } else {
        await session.abortTransaction();
        return { ...tryAgain };
      }

    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction error:", error);
      return serverError;
    } finally {
      await session.endSession();
    }
  }

}

export default Users;