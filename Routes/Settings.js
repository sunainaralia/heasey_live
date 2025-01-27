import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { requiredFields } from "../Utils/Messages.js";
import multer from "multer";
import collections from "../Utils/Collection.js";
import Settings from "../Controllers/Settings.js"

const routes = express.Router();
const upload = multer();
const settings = new Settings();
const authController = new Auth();

// Get All Sources with Pagination
routes.get("/settings", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const sources = await settings.getSettingss(page, limit);
    return res.status(sources.status).send(sources);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Source Count
routes.get("/settings/count", authController.verifyToken, async (req, res) => {
  try {
    const count = await collections.settingsCollection().countDocuments();
    res.status(200).send({
      status: 200,
      count: count
    });
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Source
routes.post(
  "/settings",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.settings),
  async (req, res) => {
    try {
      const result = await settings.createSettings({
        ...req.body,
      });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Source by ID
routes.get(
  "/settings/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await settings.getSettingsById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get Source by Type
routes.get("/settings/type/:type", authController.verifyToken, async (req, res) => {
  try {
    const result = await settings.getSettingsByType(req.params.type);
    return res.status(result.status).send(result);
  } catch (error) {
    console.error(error);
    return res.status(serverError.status).send(serverError);
  }
});

// Update Source
routes.put(
  "/settings/:id",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await settings.updateSettingsById({
        id: req.params.id,
        ...req.body,
      });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete Source
routes.delete(
  "/settings/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const result = await settings.deleteSettingsById(req.params.id);
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Auth Source (Special endpoint for authentication purposes)
routes.get(
  "/settings/auth/:type",
  authController.verifyToken,
  async (req, res) => {
    try {
      const result = await settings.authSettings(
        req.params.type,
        true,
        req.session
      );
      if (result) {
        return res.status(200).send({
          status: 200,
          data: result
        });
      }
      return res.status(404).send({
        status: 404,
        message: "Settings not found"
      });
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

export default routes;