import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Cart from "../Controllers/Cart.js";
const routes = express.Router();
const upload = multer();
const cartController = new Cart();
const authController = new Auth();

// Get Cart Items for a user 
routes.get("/cart", authController.verifyToken, async (req, res) => {
  try {
    const userId = req.headers.userId || req.headers.userid;
    const cartItems = await cartController.getCartItems(userId);
    return res.status(cartItems.status).send(cartItems);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Cart Summary (Total Quantity and Price)
routes.get("/cart/summary", authController.verifyToken, async (req, res) => {
  try {
    const summary = await cartController.getCartSummary();
    res.status(summary.status).send(summary);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Add Product to Cart
routes.post(
  "/cart",
  upload.none(),
  authController.verifyToken,
  authController.checkFields(reqFields.cart),
  async (req, res) => {
    try {
      const userId = req.headers.userId || req.headers.userid;
      const result = await cartController.addToCart({ userId, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Product Quantity in Cart
routes.put(
  "/cart/:productId",
  upload.none(),
  authController.verifyToken,
  async (req, res) => {
    try {
      const userId = req.headers.userId || req.headers.userid;
      const result = await cartController.updateProductQuantity(userId, req.params.productId, req.body.quantity);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Remove Product from Cart
routes.delete(
  "/cart/:productId",
  authController.verifyToken,
  async (req, res) => {
    try {
      const userId = req.headers.userId || req.headers.userid;
      if (!userId) {
        return res.status(400).send({ message: 'User ID is required' });
      }
      const result = await cartController.removeFromCart(userId, req.params.productId);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Remove Expired Products from Cart
routes.delete("/cart/expired", authController.verifyToken, async (req, res) => {
  try {
    const userId = req.headers.userId || req.headers.userid;
    if (!userId) {
      return res.status(400).send({ message: 'User ID is required' });
    }
    const result = await cartController.removeExpiredItems();
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

export default routes;
