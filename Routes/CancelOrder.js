import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import CancelledOrder from "../Controllers/CancelOrder.js";

const routes = express.Router();
const upload = multer();
const orderCancellController = new CancelledOrder();
const authController = new Auth();
// Create New Order
routes.post(
  "/cancel-order",
  upload.none(),
  authController.verifyToken,
  authController.checkFields(["orderId", "cancellationReason"]),
  async (req, res) => {
    try {
      const result = await orderCancellController.cancelOrder({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      console.log(error)
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);
export default routes;