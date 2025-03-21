import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import AppReview from "../Controllers/AppReview.js";

const routes = express.Router();
const upload = multer();
const appReviewController = new AppReview();
const authController = new Auth();

// Get All Reviews with Pagination
routes.get("/appReviews", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const reviewsList = await appReviewController.getReviews(page, limit);
    return res.status(reviewsList.status).send(reviewsList);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});


// Get Review Count
routes.get("/appReviews/count", authController.verifyToken, async (req, res) => {
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
  "/appReviews",
  authController.verifyToken,
  authController.checkFields(reqFields.appReview),
  async (req, res) => {
    try {
      const result = await appReviewController.createReview({ ...req.body });
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
  "/appReviews/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await appReviewController.getReviewById(req.params.id);
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
  "/appReviews/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await appReviewController.updateReviewById({ id: req.params.id, ...req.body });
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
  "/appReviews/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await appReviewController.deleteReviewById(req.params.id);
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
