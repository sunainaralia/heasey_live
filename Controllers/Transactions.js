import { ObjectId } from "mongodb";
import {
  columnUpdated,
  columnCreated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
  notExist,
  unauthorized,
  transaction
} from "../Utils/Messages.js";
import UserTransactionModel from "../Models/Transactions.js"
import Notifications from "./Notifications.js";
import {
  amountAdded,
  amountWithdraw,
  transactionMade,
  transfered,
} from "../Utils/Notifications.js";
import User from "./Users.js";
import collections from "../Utils/Collection.js";
import { client } from "../Db.js";
import { options, sendMail, transponder } from "../Utils/Mailer.js";
import Auth from "../Utils/Middlewares.js";
// import { sendSms } from "../../Mailer/smsService.js";
const userTrans = new UserTransactionModel();

// User Controller
const user = new User();
const authentications = new Auth();
class UserTrans extends Notifications {
  constructor() {
    super();
  }

  // Get User Transactions with default limit 10
  async getUserTrans(page, limit) {
    let skip = (page) * limit;
    try {
      const result = await collections
        .transactions()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalTransactions = await collections
        .transactions()
        .countDocuments({});
      if (result.length > 0) {
        return {
          ...fetched("User Transaction"),
          data: result,
          length: totalTransactions
        };
      } else {
        return tryAgain;
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }

  // Static Add Transaction Function
  async addTransaction(transaction) {
    const result = await collections.transactions().insertOne(transaction);
    if (result.acknowledged && result.insertedId) {
      return result;
    }
    return null;
  }

  // Create new purchase transaction
  async createPurchase(body) {
    try {
      const transactionbody = {
        ...body,
      };

      if (!body?.status) {
        return tryAgain;
      }
      return {
        ...columnCreated("Transaction"),
        data: {
          data: result.insertedId,
        },
      };

    } catch (err) {
      console.log(err);
      return {
        ...serverError,
        ...err,
      };
    }
  }

  // Get User Transactions by User ID for specific month and year
  async getUserTransByUserId(id, month, year, page, limit) {
    let value = id.toLowerCase();

    try {
      let skip = page * limit;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const result = await collections
        .transactions()
        .find({
          $and: [{
            userId: value,
          }]
        }).skip(skip)
        .limit(limit)
        .toArray();
      const totalTransactions = await collections
        .transactions()
        .countDocuments({
          userId: value,
        });

      if (result && result.length > 0) {
        return {
          ...fetched("User Transaction"),
          data: result,
          length: totalTransactions
        };
      } else {
        return notExist("transaction");
      }
    } catch (err) {
      console.log(err);
      return {
        ...serverError,
        err,
      };
    }
  }

  // Get selected User Transaction by ID
  async getUserTransById(id) {
    try {
      const result = await collections.transactions().findOne({
        _id: new ObjectId(id),
      });
      if (result) {
        let data = userTrans.fromJson(result);
        return {
          ...fetched("User Transaction"),
          data: data,
        };
      } else {
        return InvalidId("User Transaction");
      }
    } catch (err) {
      return serverError;
    }
  }

  // Update User Transaction
  async updateUserTransById(body) {
    try {
      const { id } = body;
      const trans = userTrans.toUpdateJson(body);

      const result = await collections.transactions().updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            ...trans,
          },
        }
      );

      if (result.modifiedCount > 0) {
        return {
          ...columnUpdated("User Transaction"),
        };
      } else {
        return InvalidId("User Transaction");
      }
    } catch (err) {
      console.error("Error:", err);
      return serverError;
    }
  }

  // Filter Transactions by specific parameters
  async filterTransaction(filterParams) {
    try {
      const result = await collections
        .transactions()
        .find({ ...filterParams })
        .toArray();
      if (result.length > 0) {
        return {
          ...fetched("Transactions"),
          data: result,
        };
      }
      return {
        ...notExist("Transactions"),
        data: {},
      };
    } catch (err) {
      console.log("Error in filter transaction controller");
      return serverError;
    }
  }

  // Get Pending Withdraw Transactions
  async getPendingWithdraw() {
    try {
      const response = await collections.transactions().find({ $and: [{ type: "withdraw" }, { status: false }] }).toArray();
      if (response && response.length > 0) {
        return { ...fetched("Pending withdrawal"), data: response };
      } else {
        return notExist("Pending Withdraw");
      }
    } catch (err) {
      return serverError;
    }
  }

  // Reject Withdraw Transaction
  async rejectWithdraw(id) {
    try {
      const response = await collections.transactions().findOne({ _id: new ObjectId(id) });
      if (response && !response.status) {
        let amount = parseFloat(response.amount);
        const user = await collections.userCollection().updateOne({ userId: response.userId }, { $inc: { totalWithdraw: -amount, wallet: amount } });
        if (user.acknowledged && user.modifiedCount > 0) {
          await collections.transactions().deleteOne({ _id: new ObjectId(id) });
          return withdrawRejected;
        } else {
          return tryAgain;
        }
      } else {
        return tryAgain;
      }
    } catch (err) {
      return serverError;
    }
  }

  // Get Transaction by type for user
  async getTransactionByType(key, value, userId, page, limit) {
    const filter = {
      [key]: value,
    };
    const skip = parseInt(page) * limit;
    try {
      const result = await collections
        .transactions()
        .find({
          ...filter,
          userId: userId,
        })
        .skip(skip)
        .limit(limit)
        .toArray();
      if (result.length > 0) {
        return {
          ...fetched("Transactions"),
          data: result,
        };
      }
      return notExist("Transactions");
    } catch (err) {
      return serverError;
    }
  }

  // Delete User Transaction by ID
  async deleteUserTransById(id) {
    try {
      const result = await collections.transactions().deleteOne({
        _id: new ObjectId(id),
      });
      if (result.deletedCount > 0) {
        return {
          ...deleted("User Transaction"),
          data: {},
        };
      } else {
        return InvalidId("User Transaction");
      }
    } catch (err) {
      console.error("Error:", err);
      return serverError;
    }
  }
  // create transactions
  async createTransaction(body) {
    const session = client.startSession();
    session.startTransaction();
    try {
      const orderId = body?.orderId || "";
      const [user, taxConfig, order, invoiceNo] = await Promise.all([
        collections.users().findOne(
          { _id: new ObjectId(body?.userId) },
          { session }
        ),
        collections.settings()
          .findOne({ type: "tax-config" }, { session }),
        collections.orders().findOne(
          { _id: new ObjectId(orderId) }, { session }
        ),
        collections.transactions().countDocuments()
      ]);

      if (!user || !taxConfig || !order || invoiceNo == null) {
        await session.abortTransaction();
        return tryAgain;
      }

      const taxRate = taxConfig?.value;

      const newTransaction = new UserTransactionModel(
        null,
        body?.userId,
        parseFloat(body.amount) ?? parseFloat(order.amount),
        parseInt(taxRate),
        "",
        "",
        `hea|${parseInt(invoiceNo) + 1}`,
        true,
        body.paymentMethod,
        new Date(),
        new Date()
      );

      const result = await collections.transactions().insertOne(newTransaction.toDatabaseJson(), { session });
      if (!result || !result.insertedId) {
        await session.abortTransaction();
        return tryAgain;
      }

      let option = options(
        user.email,
        "Heasey Transaction Code Generated",
        transaction(user?._id, transaction?.amount, result?.insertedId, user?.fullName)
      );

      await sendMail(option);

      let orderUpdate = await collections.orders().updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { transactionId: result.insertedId.toString(), type: "confirmed" } },
        { session }
      );
      if (orderUpdate.acknowledged && orderUpdate.modifiedCount > 0) {

        await session.commitTransaction();

        return {
          ...columnCreated("Transaction"),
          data: { id: result.insertedId }
        };
      } else {
        return tryAgain;
      }
    } catch (error) {
      console.error(error);
      await session.abortTransaction();
      return serverError;
    }
    finally {
      session.endSession()
    }
  }

}

export default UserTrans;
