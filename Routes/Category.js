import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Category from "../Controllers/Category.js";

const routes = express.Router();
const upload = multer();
const category = new Category();
const authController = new Auth();

// Get All Categories with Pagination
routes.get("/categories", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const categories = await category.getCategories(page, limit);
    return res.status(categories.status).send(categories);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Category Count
routes.get("/categories/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.categories().countDocuments();
    res.status(200).send({ status: 200, count });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Category
routes.post(
  "/categories",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.category),
  async (req, res) => {
    try {
      const result = await category.createCategory({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Category by ID
routes.get(
  "/categories/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await category.getCategoryById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Category
routes.put(
  "/categories/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await category.updateCategoryById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Category
routes.delete(
  "/categories/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await category.deleteCategoryById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);
// Upload Product Images
routes.post("/products/:id/images", upload.array("images", 5), authController.verifyToken, async (req, res) => {
  try {
    const result = await products.changeProductImages(req.params.id, req.files);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

export default routes;
