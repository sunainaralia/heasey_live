import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import ProductReview from "../Controllers/ProductReview.js";

const routes = express.Router();
const upload = multer();
const productReviewController = new ProductReview();
const authController = new Auth();

// Get All Reviews with Pagination
routes.get("/productReviews", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const reviewsList = await productReviewController.getReviews(page, limit);
    return res.status(reviewsList.status).send(reviewsList);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});


// Get Review Count
routes.get("/productReviews/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.reviews().countDocuments();
    res.status(200).send({ status: 200, count });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Review
routes.post(
  "/productReviews",
  authController.verifyToken,
  authController.checkFields(reqFields.productReview),
  async (req, res) => {
    try {
      const result = await productReviewController.createReview({ ...req.body });
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Review by ID
routes.get(
  "/productReviews/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await productReviewController.getReviewById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Review
routes.put(
  "/productReviews/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await productReviewController.updateReviewById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Review
routes.delete(
  "/productReviews/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await productReviewController.deleteReviewById(req.params.id);
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
