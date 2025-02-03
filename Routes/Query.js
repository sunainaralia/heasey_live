import express from "express";
import Auth from "../Utils/Middlewares.js";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import Query from "../Controllers/Query.js";

const routes = express.Router();
const query = new Query();
const authController = new Auth();

// Get All Queries with Pagination
routes.get("/queries", authController.verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    let result = await query.getQueries(page, limit);
    return res.status(result.status).send(result);
  } catch (error) {
    console.error("Error fetching queries:", error);
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Get Query by ID
routes.get("/queries/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await query.getQueryById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Create New Query
routes.post(
  "/queries",
  authController.verifyToken,
  authController.checkFields(reqFields.query),
  async (req, res) => {
    try {
      const result = await query.createQuery({ ...req.body });
      res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update Query
routes.put("/queries/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await query.updateQueryById({ id: req.params.id, ...req.body });
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

// Delete Query
routes.delete("/queries/:id", authController.verifyToken, async (req, res) => {
  try {
    const result = await query.deleteQueryById(req.params.id);
    res.status(result.status).send(result);
  } catch (error) {
    return res.status(serverError.status).send({
      ...serverError,
      error,
    });
  }
});

export default routes;