import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError, unauthorized } from "../Utils/Messages.js";
import UserTrans from "../Controllers/Transactions.js"
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
const routes = express.Router();
const upload = multer();
// Transaction Controller
const usertrans = new UserTrans();
const authController = new Auth();
// Get All user transactions
routes.get(
  "/get-user-transactions",
  authController.verifyToken,
  authController.checkAuth,
  async (req, res) => {
    try {
      const { page = 0, limit = 10 } = req.query;
      const result = await usertrans.getUserTrans(page, parseInt(limit));
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Create new transaction
routes.post(
  "/create-transaction",
  authController.verifyToken,
  authController.checkFields(["userId", "paymentMethod", "amount"]),
  async (req, res) => {
    try {
      const result = await usertrans.createTransaction({
        ...req.body,
      });
      return res.status(result.status).send(result);
    } catch (err) {
      console.log(err);
      return res.status(serverError.status).send({
        ...serverError,
        err,
      });
    }
  }
);

// Withdraw transaction API
// routes.post(
//   "/withdraw",
//   upload.none(),
//   authController.isValidUserId,
//   authController.verifyToken,
//   authController.checkFields(reqFields.transactions),
//   authController.withdrawAuth,
//   async (req, res) => {
//     try {
//       const userId = req?.query?.userId ?? req.headers?.userid ?? req?.headers?.userId;
//       if (userId == null || userId == undefined) {
//         return res.status(unauthorized.status).send(unauthorized);
//       }
//       req.body.userId = userId;

//       const result = await usertrans.createUserTrans(req.body);

//       return res.status(result.status).send(result);
//     } catch (error) {
//       console.log(error);
//       return res.status(serverError.status).send({
//         ...serverError,
//         error,
//       });
//     }
//   }
// );

// Get transaction by ID
routes.get(
  "/get-transaction-by-id/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await usertrans.getUserTransById(req.params?.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Verify transaction API
routes.get(
  "/verify-transaction/:amount",
  authController.verifyToken,
  async (req, res) => {
    try {
      let userId = req.query?.userId ?? req.headers?.userid ?? req.headers?.userId;
      const result = await usertrans.verifyTransaction(req.params?.amount, userId);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get transactions by User ID for a specific month and year
routes.get(
  "/get-transactions-by-user-id",
  authController.verifyToken,
  async (req, res) => {
    try {
      let month = req?.query?.month;
      let year = req?.query?.year;
      const { page = 0, limit = 10 } = req.query;
      let userId = req.query?.userId ?? req.headers?.userid ?? req.headers?.userId;
      const result = await usertrans.getUserTransByUserId(userId, month, year, parseInt(page), parseInt(limit));
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update transaction API
routes.put(
  "/update-transactions",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  async (req, res) => {
    try {
      const result = await usertrans.updateUserTransById({
        ...req.body,
      });
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get transactions by Type (withdraw, deposit, etc.)
routes.get(
  "/get-transaction-by-type",
  authController.verifyToken,
  async (req, res) => {
    try {
      const { type = "withdraw", page, limit = 10 } = req.query;
      const result = await usertrans.getTransactionByType(
        "type",
        type,
        req.body?.userId,
        page,
        parseInt(limit)
      );
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get pending withdrawals
routes.get("/get-pending-withdraw", authController.verifyToken, authController.checkAuth, async (req, res) => {
  try {
    const response = await usertrans.getPendingWithdraw();
    return res.status(response.status).send(response);
  } catch (err) {
    return res.status(serverError.status).send(serverError);
  }
});

// Reject a withdrawal transaction
routes.delete("/reject-withdraw/:id", authController.verifyToken, authController.checkAuth, async (req, res) => {
  try {
    const response = await usertrans.rejectWithdraw(req.params?.id);
    return res.status(response.status).send(response);
  } catch (err) {
    return res.status(serverError.status).send(serverError);
  }
});

// Filter transactions API
routes.get(
  "/filter-transactions",
  authController.verifyToken,
  authController.checkAuth,
  async (req, res) => {
    try {
      const filters = req.query;
      const result = await usertrans.filterTransaction(filters);
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete user transaction by ID
routes.delete(
  "/delete-user-trans/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await usertrans.deleteUserTransById(req.params?.id);
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// pay from wallet for product 
routes.post(
  "/pay-from-wallet",
  authController.verifyToken,
  authController.checkFields(["orderId", "paymentMethod", "amount"]),
  async (req, res) => {
    try {
      const result = await usertrans.payFromWallet(
        req,
      );
      return res.status(result.status).send(result);
    } catch (err) {
      console.log(err);
      return res.status(serverError.status).send({
        ...serverError,
        err,
      });
    }
  }
);

export default routes;
