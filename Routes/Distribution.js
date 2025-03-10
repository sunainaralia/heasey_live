import express from 'express';
import Auth from '../Utils/Middlewares.js';
import { reqFields } from '../Utils/RequiredFields.js';
import Distribution from "../Controllers/Distributions.js";
import { serverError } from '../Utils/Messages.js';
const routes = express.Router();

// Initialize controllers and middleware
const authController = new Auth();
const distributionController = new Distribution();

// Get all distributions
routes.get(
  "/get-distributions",
  authController.verifyToken,
  authController.checkAuth,
  async (req, res) => {
    try {
      const { page, limit = 10 } = req.query;
      const result = await distributionController.getDistributions(page, parseInt(limit));
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Create new distribution
routes.post(
  "/create-distribution",
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.distribution),
  async (req, res) => {
    try {
      const response = await distributionController.createDistribution(req.body);
      res.status(response.status).send(response);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Get distribution by ID
routes.get(
  "/get-distribution-by-id/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const response = await distributionController.getDistributionById(req.params.id);
      res.status(response.status).send(response);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update distribution
routes.put(
  "/update-distribution",
  authController.verifyToken,
  authController.checkAuth,
  async (req, res) => {
    try {
      const response = await distributionController.updateDistributionById(req.body);
      res.status(response.status).send(response);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Delete distribution
routes.delete(
  "/delete-distribution/:id",
  authController.verifyToken,
  authController.checkAuth,
  authController.CheckObjectId,
  async (req, res) => {
    try {
      const response = await distributionController.deleteDistributionById(req.params.id);
      res.status(response.status).send(response);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

export default routes;
