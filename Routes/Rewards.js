import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import Rewards from "../Controllers/Rewards.js";
const routes = express.Router();
const rewards = new Rewards();
const authController = new Auth();

// Get All Rewards with Pagination
routes.get("/rewards", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    let result = await rewards.getRewards(page, limit);
    return res.status(result.status).send(result);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Reward by ID
routes.get("/rewards/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await rewards.getRewardById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Reward
routes.post(
  "/rewards",
  authController.verifyToken,
  authController.checkAuth,
  authController.checkFields(reqFields.reward),
  async (req, res) => {
    try {
      const result = await rewards.createReward({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Reward
routes.put("/rewards/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await rewards.updateRewardById({ id: req.params.id, ...req.body });
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Delete Reward
routes.delete("/rewards/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await rewards.deleteRewardById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

export default routes;
