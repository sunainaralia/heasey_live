import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Products from "../Controllers/Products.js";
import { upload } from "../Utils/Multer.js";
const routes = express.Router();
// const upload = multer();
const products = new Products();
const authController = new Auth();

// Get All Products with Pagination
routes.get("/products",  async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    let result = await products.getProducts(page, limit);
    return res.status(result.status).send(result);
  } catch (error) {
    console.error("Error fetching products with images:", error);
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Products by Category ID
routes.get("/products/category/:categoryId", authController.verifyToken, async (req, res) => {
  try {
    const result = await products.getProductsByCategoryId(req.params.categoryId);
    return res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Product
routes.post(
  "/products",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.product),
  async (req, res) => {
    try {
      const result = await products.createProduct({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Product by ID
routes.get("/products/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await products.getProductById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Update Product
routes.put("/products/:id", upload.none(), authController.verifyToken, async (req, res) => {
  try {
    const result = await products.updateProductById({ id: req.params.id, ...req.body });
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Delete Product
routes.delete("/products/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await products.deleteProductById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});
// Upload Product Images
routes.post("/products/images", upload.array("images", 5), authController.verifyToken, authController.checkFields(["id"]), async (req, res) => {
  try {
    const result = await products.changeProductImages(req.body.id, req.files);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});
export default routes;
