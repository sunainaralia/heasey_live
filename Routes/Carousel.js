import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Carousel from "../Controllers/Carousel.js";

const routes = express.Router();
const upload = multer();
const carousel = new Carousel();
const authController = new Auth();

// Get All Carousels with Pagination
routes.get("/carousels", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const carousels = await carousel.getCarousels(page, limit);
    return res.status(carousels.status).send(carousels);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Carousel Count
routes.get("/carousels/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.carousels().countDocuments();
    res.status(200).send({ status: 200, count });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Carousel
routes.post(
  "/carousels",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.carousel),
  async (req, res) => {
    try {
      const result = await carousel.createCarousel({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Carousel by ID
routes.get(
  "/carousels/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await carousel.getCarouselById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Carousel
routes.put(
  "/carousels/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await carousel.updateCarouselById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Carousel
routes.delete(
  "/carousels/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await carousel.deleteCarouselById(req.params.id);
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
