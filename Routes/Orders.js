import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import Order from "../Controllers/Orders.js";

const routes = express.Router();
const upload = multer();
const orderController = new Order();
const authController = new Auth();

// Get All Orders with Pagination
routes.get("/orders", authController.verifyToken,authController.checkAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const orders = await orderController.getOrders(page, limit);
    return res.status(orders.status).send(orders);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Order Count
routes.get("/orders/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.orders().countDocuments();
    res.status(200).send({ status: 200, count });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Order
routes.post(
  "/orders",
  upload.none(),
  authController.verifyToken,
  authController.checkFields(reqFields.order),
  async (req, res) => {
    try {
      const result = await orderController.createOrder({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Order by ID
routes.get(
  "/orders/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await orderController.getOrderById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);
// Get Order by userID
routes.get(
  "/user-orders/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await orderController.getOrderByUserId(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);
// Update Order
routes.put(
  "/orders/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await orderController.updateOrderById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Order
routes.delete(
  "/orders/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await orderController.deleteOrderById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

export default routes;
