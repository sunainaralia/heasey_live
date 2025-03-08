import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Ratings from "../Controllers/Ratings.js";

const routes = express.Router();
const upload = multer();
const ratings = new Ratings();
const authController = new Auth();

// Get All Ratings with Pagination
routes.get("/ratings", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const ratingList = await ratings.getRatings(page, limit);
    return res.status(ratingList.status).send(ratingList);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Ratings by Product ID from Request Body
routes.post("/ratings/product", authController.verifyToken, authController.checkFields(["productId"]), async (req, res) => {
  try {
    const result = await ratings.getRatingsByProductId(req.body.productId);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Rating Count
routes.get("/ratings/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.ratings().countDocuments();
    res.status(200).send({ status: 200, count });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Rating
routes.post(
  "/ratings",
  authController.checkFields(reqFields.rating),
  async (req, res) => {
    try {
      const result = await ratings.createRating({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Rating by ID
routes.get(
  "/ratings/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await ratings.getRatingById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Rating
routes.put(
  "/ratings/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await ratings.updateRatingById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Rating
routes.delete(
  "/ratings/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await ratings.deleteRatingById(req.params.id);
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
