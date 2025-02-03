import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import Coupons from "../Controllers/Coupons.js";

const routes = express.Router();
const coupons = new Coupons();
const authController = new Auth();

// Get All Coupons with Pagination
routes.get("/coupons", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    let result = await coupons.getCoupons(page, limit);
    return res.status(result.status).send(result);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Coupon by ID
routes.get("/coupons/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await coupons.getCouponById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Coupon
routes.post(
  "/coupons",
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.coupon),
  async (req, res) => {
    try {
      const result = await coupons.createCoupon({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Coupon
routes.put("/coupons/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await coupons.updateCouponById({ id: req.params.id, ...req.body });
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Delete Coupon
routes.delete("/coupons/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await coupons.deleteCouponById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

export default routes;