import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Replies from "../Controllers/Replies.js";

const routes = express.Router();
const upload = multer();
const replies = new Replies();
const authController = new Auth();

// Get All Replies with Pagination
routes.get("/replies", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const replyList = await replies.getReplies(page, limit);
    return res.status(replyList.status).send(replyList);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Replies by Review ID from Request Body
routes.post("/replies/review", authController.verifyToken, authController.checkFields(["reviewId"]), async (req, res) => {
  try {
    const result = await replies.getRepliesByReviewId(req.body.reviewId);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Reply Count
routes.get("/replies/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.replies().countDocuments();
    res.status(200).send({ status: 200, count });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Reply
routes.post(
  "/replies",
  upload.none(),
  authController.verifyToken,
  authController.checkFields(reqFields.reply),
  async (req, res) => {
    try {
      const result = await replies.createReply({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Reply by ID
routes.get(
  "/replies/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await replies.getReplyById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Reply
routes.put(
  "/replies/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await replies.updateReplyById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Reply
routes.delete(
  "/replies/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await replies.deleteReplyById(req.params.id);
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
