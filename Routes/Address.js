import express from "express";
import multer from "multer";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import Address from "../Controllers/Address.js";
import { reqFields } from "../Utils/RequiredFields.js";

const routes = express.Router();
const addressController = new Address();
const upload = multer();
const authController = new Auth();

// Get all addresses
routes.get("/addresses", authController.verifyToken, async (req, res) => {
  try {
    const result = await addressController.getAllAddresses();
    res.status(result.status).send(result);
  } catch (error) {
    res.status(serverError.status).send({ ...serverError, error });
  }
});

// Get addresses of a specific user
routes.get("/addresses/user/:userId", authController.verifyToken, async (req, res) => {
  try {
    const result = await addressController.getAddressesByUserId(req.params.userId);
    res.status(result.status).send(result);
  } catch (error) {
    res.status(serverError.status).send({ ...serverError, error });
  }
});

// Create new address
routes.post(
  "/addresses",
  upload.none(),
  authController.verifyToken,
  authController.checkFields(reqFields.address),
  async (req, res) => {
    try {
      const result = await addressController.createAddress({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      res.status(serverError.status).send({ ...serverError, error });
    }
  }
);

// Update address by ID
routes.put(
  "/addresses/:id",
  upload.none(),
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await addressController.updateAddressById({ id: req.params.id, ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      res.status(serverError.status).send({ ...serverError, error });
    }
  }
);

// Delete address by ID
routes.delete(
  "/addresses/:id",
  authController.verifyToken,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await addressController.deleteAddressById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      res.status(serverError.status).send({ ...serverError, error });
    }
  }
);

export default routes;
