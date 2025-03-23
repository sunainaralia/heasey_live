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
  transaction,
  notFound,
  insufficientBalInWallet,
  invalidId
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
import TransactionModel from "../Models/Transactions.js";
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
    let sessionActive = false;
    try {
      await session.startTransaction();
      sessionActive = true;
      const [user, taxConfig, invoiceNo] = await Promise.all([
        collections.users().findOne({ _id: new ObjectId(body?.userId) }, { session }),
        collections.settings().findOne({ type: "tax-config" }, { session }),
        collections.transactions().countDocuments({}, { session })
      ]);

      if (!user || !taxConfig) {
        console.warn("Error: Required data not found.");
        await session.abortTransaction();
        sessionActive = false;
        return tryAgain;
      };
      const taxRate = parseInt(taxConfig?.value ?? 0);
      const transactionAmount = parseFloat(body.amount ?? 0);
      if (transactionAmount <= 0) {
        await session.abortTransaction();
        sessionActive = false;
        return tryAgain;
      };
      const newTransaction = new UserTransactionModel(
        null,
        body?.userId,
        transactionAmount,
        taxRate,
        "",
        "",
        `hea|${invoiceNo + 1}`,
        true,
        body.paymentMethod,
        new Date(),
        new Date()
      );

      const result = await collections.transactions().insertOne(newTransaction.toDatabaseJson(), { session });

      if (!result || !result.insertedId) {
        console.warn("Error: Transaction insertion failed.");
        await session.abortTransaction();
        sessionActive = false;
        return tryAgain;
      }
      const updateWallet = await collections.users().findOneAndUpdate(
        { _id: new ObjectId(body?.userId) },
        { $inc: { wallet: transactionAmount } },
        { session, returnDocument: "after" }
      );

      if (!updateWallet) {
        console.warn("Error: Wallet update failed. User may not exist.");
        await session.abortTransaction();
        sessionActive = false;
        return tryAgain;
      };
      let emailOptions = options(
        user.email,
        "Heasey Wallet Credit Successful",
        transaction(user?._id, newTransaction.amount, result?.insertedId, user?.fullName)
      );

      await sendMail(emailOptions);
      await session.commitTransaction();
      sessionActive = false;

      return {
        ...columnCreated("Transaction"),
        data: { id: result.insertedId }
      };

    } catch (error) {
      console.error("Error in createTransaction:", error);
      if (sessionActive) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          console.error("Error aborting transaction:", abortError);
        }
        sessionActive = false;
      }
      return serverError;
    } finally {
      if (sessionActive) {
        console.warn("Session was not closed properly. Aborting transaction.");
        try {
          await session.abortTransaction();
        } catch (error) {
          console.error("Error aborting transaction in finally:", error);
        }
      }
      session.endSession();
    }
  }

  // pay through wallet 
  async payFromWallet(req) {
    const session = client.startSession();
    let sessionActive = false;
    try {
      await session.startTransaction();
      sessionActive = true;
      const { orderId, amount } = req.body;
      const userId = req.headers.userid || req.headers.userId;
      if (!ObjectId.isValid(userId) || !ObjectId.isValid(orderId)) {
        await session.abortTransaction();
        sessionActive = false;
        return invalidId("userId or orderId");
      };
      const [user, order, taxConfig, invoiceNo] = await Promise.all([
        collections.users().findOne({ _id: new ObjectId(userId) }, { session }),
        collections.orders().findOne({ _id: new ObjectId(orderId) }, { session }),
        collections.settings().findOne({ type: "tax-config" }, { session }),
        collections.transactions().countDocuments({}, { session })
      ]);

      if (!user || !order) {
        await session.abortTransaction();
        sessionActive = false;
        return notFound("User or Order ");
      }

      const walletBalance = parseFloat(user.wallet ?? 0);
      const orderAmount = parseFloat(order.amount ?? amount);
      const taxRate = parseFloat(taxConfig?.value ?? 0);

      if (walletBalance < orderAmount) {
        await session.abortTransaction();
        sessionActive = false;
        return insufficientBalInWallet;
      }

      const updateWallet = await collections.users().findOneAndUpdate(
        { _id: new ObjectId(userId), wallet: { $gte: orderAmount } },
        { $inc: { wallet: -orderAmount } },
        { session, returnDocument: "after" }
      );

      if (!updateWallet) {
        await session.abortTransaction();
        sessionActive = false;
        return tryAgain;
      };
      const transactionData = new TransactionModel(
        null,
        userId,
        orderAmount,
        taxRate,
        "wallet",
        "",
        `hea|${invoiceNo + 1}`,
        true,
        "wallet",
        new Date(),
        new Date()
      );

      const transactionResult = await collections.transactions().insertOne(transactionData.toDatabaseJson(), { session });

      if (!transactionResult || !transactionResult.insertedId) {
        await session.abortTransaction();
        sessionActive = false;
        return tryAgain;
      }
      const updateOrder = await collections.orders().findOneAndUpdate(
        { _id: new ObjectId(orderId) },
        { $set: { status: true, type: "confirmed", transactionId: transactionResult.insertedId.toString() } },
        { session, returnDocument: "after" }
      );

      if (!updateOrder) {
        await session.abortTransaction();
        sessionActive = false;
        return serverError;
      }

      await session.commitTransaction();
      sessionActive = false;

      return {
        ...columnCreated("Transaction"),
        data: { transactionId: transactionResult.insertedId, orderId: orderId }
      };

    } catch (err) {
      console.error("Error in payFromWallet:", err);

      if (sessionActive) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          console.error("Error aborting transaction:", abortError);
        }
        sessionActive = false;
      }

      return serverError;
    } finally {
      if (sessionActive) {
        console.warn("Session was not closed properly. Aborting transaction.");
        try {
          await session.abortTransaction();
        } catch (error) {
          console.error("Error aborting transaction in finally:", error);
        }
      }
      session.endSession();
    }
  }


}

export default UserTrans;
