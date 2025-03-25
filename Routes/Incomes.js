import express from "express";
import multer from "multer";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import Income from "../Controllers/Incomes.js";

const routes = express.Router();
const upload = multer();
const incomeController = new Income();
const authController = new Auth();

// Get all incomes
routes.get("/incomes", authController.verifyToken, async (req, res) => {
  try {
    const result = await incomeController.getAllIncome();
    res.status(result.status).send(result);
  } catch (error) {
    res.status(serverError.status).send({ ...serverError, error });
  }
});

// Get incomes of a specific user
routes.get("/incomes/user/:userId", authController.verifyToken, async (req, res) => {
  try {
    const result = await incomeController.getIncomeByUserId(req.params.userId);
    res.status(result.status).send(result);
  } catch (error) {
    res.status(serverError.status).send({ ...serverError, error });
  }
});

// Create new income
routes.post(
  "/incomes",
  upload.none(),
  authController.verifyToken,
  authController.checkAuth,
  async (req, res) => {
    try {
      const result = await incomeController.createIncome({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      res.status(serverError.status).send({ ...serverError, error });
    }
  }
);

export default routes;
