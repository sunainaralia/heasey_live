import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Reviews from "../Controllers/Reviews.js";

const routes = express.Router();
const upload = multer();
const reviews = new Reviews();
const authController = new Auth();

// Get All Reviews with Pagination
routes.get("/reviews", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const reviewList = await reviews.getReviews(page, limit);
    return res.status(reviewList.status).send(reviewList);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Reviews by Product ID from Request Body
routes.post("/reviews/product", authController.verifyToken, authController.checkFields(["productId"]), async (req, res) => {
  try {
    const result = await reviews.getReviewsByProductId(req.body.productId);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Review Count
routes.get("/reviews/count", authController.verifyToken, async (req, res) => {
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
  "/reviews",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.review),
  async (req, res) => {
    try {
      const result = await reviews.createReview({ ...req.body });
      res.status(result.status).send(result);
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
  "/reviews/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await reviews.getReviewById(req.params.id);
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
  "/reviews/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await reviews.updateReviewById({ id: req.params.id, ...req.body });
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
  "/reviews/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await reviews.deleteReviewById(req.params.id);
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
