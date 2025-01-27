import collections from "../Utils/Collection.js";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { attemptLeft, found, invalidId, loggedIn, serverError, tryAgain, unauthorized, registered, invalidLoginCred, otpSent, invalidOtp, uploadError, columnUpdated } from "../Utils/Messages.js";
import UserModel from "../Models/Users.js";
import settingsModel from "../Models/Settings.js";
import Auth from "../Utils/Middlewares.js";
import { isRefferalKeyUnique, generateReferralKey } from "../Utils/referral.js";
import NotificationModel from "../Models/Notifications.js";
import { newRef } from "../Utils/Notifications.js";
import Notifications from "./Notifications.js";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { sendMail, options } from "../Utils/Mailer.js";
import fs from 'fs';
import path from "path";
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
          user.image
        })
        let message = found("Users");
        return {
          message,
          data: users,
          length: count
        };
      }

      let message = notFound("Users")
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
      let value = id.toLowerCase();
      let objectIdQuery = null;

      if (ObjectId.isValid(value)) {
        objectIdQuery = new ObjectId(value);
      }

      const result = await collections.users().findOne({
        $or: [{ _id: objectIdQuery }, { email: value }]
      });

      if (!result || (result._id != value && result.email.toLowerCase() != value)) {
        return invalidId("user");
      }

      const { email, fullName, _id } = result;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in database
      await collections.verification().insertOne({
        otp,
        userId: _id,
        status: true,
        createdAt: new Date(),
      });

      // Create expiry index
      await collections.verification().createIndex(
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
        throw new Error('Failed to send email');
      }

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
      const verify = await collections.verification().findOne({
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
              userId: user._id,
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
          res.status(tryAgain.status).send(tryAgain);
        }
      } else {
        return res.status(invalidOtp.status).send(invalidOtp);
      }
    } catch (err) {
      return res.status(serverError.status).send(serverError);
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
        return res.status(msg.status).send(msg);
      }
      const user = new UserModel().fromJson(result);

      if (user.attempt <= 0) {
        return res.status(limitCrossed.status).send(limitCrossed);
      }

      const isPasswordCorrect = await new Auth().ComparePassword(password, user.password);

      if (!isPasswordCorrect) {
        await collections.users().updateOne({ _id: user._id }, { $inc: { attempt: -1 } });
        const message = invalidLoginCred(user.attempt - 1);
        return res.status(message.status).send(message);
      }

      // Password is correct
      if (user.attempt < 5) {
        // Reset the attempt counter to 5
        await collections.users().updateOne({ _id: user._id }, { $set: { attempt: 5 } });
      }

      // Generate a JWT token
      const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

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
        return res.status(200).send({
          status: 200,
          message: "Login successful",
          data: {
            token: token,
            userId: user._id,
            member: true,
            sponsorId: sponsorId
          },
        });
      } else {
        return res.status(200).send({
          status: 200,
          message: "Login successful",
          data: {
            token: token,
            userId: user._id,
            member: false,
            sponsorId: ""
          },
        });
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
        title: "user-types",
        status: true
      });
      if (!userTypeSettings) {
        return tryAgain
      }
      const settingModel = settingsModel.fromJson(userTypeSettings);
      const allowedUserType = settingModel.value.split(',').map(type => type.trim());
      if (!allowedUserType.includes(user.type)) {
        return unauthorized;
      };
      const hashedPassword = new Auth().hashPassword(user.password);
      user.password = await hashedPassword;
      let referralId = generateReferralKey();
      while (!isRefferalKeyUnique(referralId)) {
        referralId = generateReferralKey()
      };
      user.referralId = referralId;
      let sponsorId = user.sponsorId;
      if (sponsorId) {
        console.log("yes")
        let sponsorUser = await this.getSponsorInfo(sponsorId, "individual");
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
      let placementId = user.placementId
      if (placementId) {
        let placementUser = await this.getSponsorInfo(placementId, "individual");
        if (!placementUser || !placementUser.referralId) {
          placementUser = await this.getSponsorInfo(placementId, "admin");
          if (!placementUser || !placementUser.status) {
            return invalidId("Sponsor");
          }
          if (!placementUser?.status) {
            return invalidId("Placementor");
          }
        }
        let newPlacementLevel = Number(placementUser.level) + 1;
        user.placementLevel = newPlacementLevel;
      } else {
        user.placementLevel = 0
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
  // update user 
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

      // Validate the userId
      if (!ObjectId.isValid(userId)) {
        const msg = invalidId("User");
        return res.status(msg.status).send(msg);
      }

      // Verify if the user exists
      const user = await collections.users().findOne({ _id: new ObjectId(userId) });
      if (!user) {
        const msg = invalidId("User");
        return res.status(msg.status).send(msg);
      }

      // Prepare the updated fields
      const updatedFields = new UserModel().toUpdateJson(req.body);

      // Update the user's information in the database
      const result = await collections.users().updateOne(
        { _id: new ObjectId(userId) },
        { $set: updatedFields }
      );

      if (result.modifiedCount > 0) {
        const msg = columnUpdated("User");
        return res.status(msg.status).send({
          ...msg,
          data: updatedFields,
        });
      } else {
        const msg = tryAgain;
        return res.status(msg.status).send(msg);
      }
    } catch (err) {
      console.error("Error in updateUser:", err);
      const msg = serverError;
      return res.status(msg.status).send(msg);
    }
  }

}

export default Users;