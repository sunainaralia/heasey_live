import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Feedbacks from "../Controllers/Feedbacks.js";

const routes = express.Router();
const upload = multer();
const feedbacks = new Feedbacks();
const authController = new Auth();

// Get All Feedbacks with Pagination
routes.get("/feedbacks", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const feedbackList = await feedbacks.getFeedbacks(page, limit);
    return res.status(feedbackList.status).send(feedbackList);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Feedbacks by User ID
routes.post("/feedbacks/user", authController.verifyToken, authController.checkFields(["userId"]), async (req, res) => {
  try {
    const result = await feedbacks.getFeedbacksByUserId(req.body.userId);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Feedback Count
routes.get("/feedbacks/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.feedbacks().countDocuments();
    res.status(200).send({ status: 200, count });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Feedback
routes.post(
  "/feedbacks",
  upload.none(),
  authController.verifyToken,
  authController.checkFields(reqFields.feedback),
  async (req, res) => {
    try {
      const result = await feedbacks.createFeedback({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Feedback by ID
routes.get(
  "/feedbacks/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await feedbacks.getFeedbackById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Feedback
routes.put(
  "/feedbacks/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await feedbacks.updateFeedbackById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Feedback
routes.delete(
  "/feedbacks/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await feedbacks.deleteFeedbackById(req.params.id);
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
