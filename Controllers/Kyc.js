import { ObjectId } from "mongodb";
import fs, { Dir } from 'fs';
import {
  columnUpdated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
  notExist,
  kycExist,
  kycRejected,
  unauthorized,
  kycRequired,
} from "../Utils/Messages.js";
import KycDetailsModel from "../Models/kyc.js";
import Users from "./Users.js";
import collections from "../Utils/Collection.js";
import ifsc from "ifsc";
import path from "path";
import { options, sendMail, transponder } from "../Utils/Mailer.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from "../Utils/FileReader.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Models
const kycDetail = new KycDetailsModel();

class KycDetail extends Users {
  constructor() {
    super();
  }
  // get kyc details
  async getKycDetail(page, limit) {
    try {
      let skip = parseInt(page) * limit;
      const result = await collections
        .kycCollection()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();
      if (result.length > 0) {
        result.forEach(result => {
          result.aadharFile[0] = result.aadharFile[0] ? readFile(result?.aadharFile[0]) : ""
          result.aadharFile[1] = result.aadharFile[1] ? readFile(result?.aadharFile[1]) : ""
          result.panFile = result.panFile ? readFile(result?.panFile) : ""
          result.sign = result.sign ? readFile(result?.sign) : ""
        })
        return {
          ...fetched("KYC Details"),
          data: result,
        };
      } else {
        return notExist("KYC Details");
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }

  // create kyc details
  async createKycDetail(body) {
    try {
      const userId = body.userId;

      // Validate IFSC code and other body parameters
      if (!ifsc.validate(body.IFSC)) {
        return InvalidId("IFSC");
      }

      // Check if the user exists in the address collection
      // const countAdd = await collections.addCollection().countDocuments({
      //   userId: userId,
      // });

      // if (countAdd < 1) {
      //   return noAddress;
      // }

      // Check if the KYC already exists
      const countKyc = await collections.kycCollection().countDocuments({
        $or: [{ userId: userId }, { panNo: body.panNo }, { aadharNo: body.aadharNo }]
      });

      if (countKyc > 0) {
        return kycExist; 
      }

      // Create new KYC entry
      const add = kycDetail.fromJson(body); 
      const result = await collections.kycCollection().insertOne(add.toDatabaseJson());

      if (result && result.insertedId) {
        return {
          ...kycRequired,
          data: {
            id: result.insertedId,
            userId: userId,
          },
        };
      } else {
        return tryAgain;
      }
    } catch (error) {
      console.error('Error in createKycDetail:', error);
      return serverError;
    }
  }

  // upload documents
  async uploadDocument(aadharFront, aadharBack, panFile, sign, userId) {
    try {
      const kycExist = await collections.kycCollection().countDocuments({ userId: userId });
      if (kycExist == 0 || kycExist > 1) {
        return unauthorized;
      }

      const userFolder = path.join(__dirname, '../..', 'uploads', userId);

      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }

      // Save Aadhar front file
      const aadharFrontPath = path.join(userFolder, aadharFront.originalname);
      fs.writeFileSync(aadharFrontPath, aadharFront.buffer);

      // Save Aadhar back file
      const aadharBackPath = path.join(userFolder, aadharBack.originalname);
      fs.writeFileSync(aadharBackPath, aadharBack.buffer);

      // Save PAN card file
      const panFilePath = path.join(userFolder, panFile.originalname);
      fs.writeFileSync(panFilePath, panFile.buffer);

      // Save signature file
      const signFilePath = path.join(userFolder, sign.originalname);
      fs.writeFileSync(signFilePath, sign.buffer);

      const result = await collections.kycCollection().updateOne({ userId: userId }, { $set: { aadharFile: [aadharFrontPath, aadharBackPath], panFile: panFilePath, sign: signFilePath, status: false } });
      const user = await collections.users().findOne({ _id: new ObjectId(userId) })
      if (result.modifiedCount > 0) {
        // let mailOption = options(
        //   user.email,
        //   subAccCreated,
        //   accountCreated(user.userId, user.fullName)
        // );
        // await transponder.verify();
        // await sendMail(mailOption);
        return { ...kycDone, data: { id: user.userId } };
      }
      await collections.kycCollection().updateOne({ userId: userId }, { $set: { status: false } });
      return tryAgain;
    } catch (error) {
      console.log(error);
      return serverError;
    }
  }

  // get kyc details by user id 
  async getKycDetailByUserId(id) {
    try {
      const result = await collections.kycCollection().findOne({
        userId: id,
      });
      if (result && result?.userId) {
        return {
          ...fetched("kycDetail"),
          data: result,
        };
      } else {
        return InvalidId("User");
      }
    } catch (err) {
      return serverError;
    }
  }
  // get kyc details by id 
  async getKycDetailById(id) {
    try {
      const result = await collections.kycCollection().findOne({
        _id: new ObjectId(id),
      });
      if (result) {
        let data = new KycDetailsModel().fromJson(result);
        return {
          ...fetched("kycDetail"),
          data: data,
        };
      } else {
        return InvalidId("kyc Detail");
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }
  // update kyc by id
  async updateKycById(body) {
    try {
      const { id } = body;
      const add = kycDetail.toUpdateJson(body);

      const result = await collections.kycCollection().updateOne(
        {
          userId: id.toLowerCase(),
        },
        {
          $set: {
            ...add,
          },
        }
      );

      if (result.modifiedCount > 0) {
        return {
          ...columnUpdated("kyc Detail"),
        };
      } else {
        return InvalidId("KYC");
      }
    } catch (err) {
      console.log
      return {
        ...serverError,
        err,
      };
    }
  }
// delete kyc by id 
  async deleteKycDetailById(id) {
    try {
      const result = await collections.kycCollection().findOneAndDelete({
        _id: new ObjectId(id),
      });
      if (result && result.userId) {
        let user = await collections.userCollection().findOneAndUpdate({ userId: result.userId }, { $set: { isVerified: false } }, { returnDocument: "after" });
        let option = options(user.email, "KYC required!", kycRejected(user.fullName, user.userId));
        await transponder.verify();
        await sendMail(option);
        return {
          ...deleted("kyc Details"),
        };
      } else {
        return InvalidId("kyc Detail");
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }
}

export default KycDetail;
