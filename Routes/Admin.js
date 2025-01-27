import express from "express";
import Auth from "../Utils/Middlewares.js";
import multer from "multer";
import { serverError } from "../Utils/Messages.js";
import { reqFields } from "../Utils/RequiredFields.js";
import Admin from "../Controllers/Admin.js";

const routes = express.Router();
const upload = multer();

// Controllers
const adminController = new Admin();
const authMiddleware = new Auth();

// Get All Users
routes.get(
  "/get-admins",
  authMiddleware.verifyToken,
  authMiddleware.checkAuth,
  async (req, res) => {
    try {
      const { page = 0, limit = 10 } = req.query;
      const userId = req.headers?.id ?? req.headers?.Id;
      const result = await adminController.getUsers(userId, page, parseInt(limit));
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send(serverError);
    }
  }
);

// User Login API
routes.post(
  "/admin-login",
  upload.none(),
  authMiddleware.checkFields(["email", "password"]),
  authMiddleware.checkPassword,
  adminController.login
);

// User Login API
routes.put("/activate-staff", upload.none(), authMiddleware.checkFields(["id"]), authMiddleware.verifyToken, authMiddleware.checkAuth, async (req, res) => {
  try {
    const userId = req.body?.id;
    const result = await adminController.activate(userId);
    return res.status(result.status).send(result);
  } catch (err) {
    return res.status(serverError.status).send(serverError);
  }
});

// Admin Registration API
routes.post(
  "/register-admin",
  upload.none(),
  authMiddleware.checkFields(reqFields.admin),
  authMiddleware.checkPassword,
  authMiddleware.adminExists,
  async (req, res) => {
    try {
      const result = await adminController.registerAdmin(req.body);
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Verify OTP for Login
routes.post("/verify-admin-otp", upload.none(), authMiddleware.checkFields(["userId", "otp"]), adminController.verifyOtp)

// OTP Login API
routes.post("/send-admin-otp", upload.none(), authMiddleware.checkFields(["userId"]), async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await adminController.sendOtp(userId);
    return res.status(result.status).send(result);
  } catch (err) {
    return res.status(serverError.status).send(serverError);

  }
})

// Get User by user Id API
routes.get(
  "/get-admin-by-id",
  authMiddleware.verifyToken,
  async (req, res) => {
    try {
      let id = req.headers?.id ?? req.headers?.Id;
      if (req.query && req.query.hasOwnProperty("id") && req.query?.id) {
        id = req.query?.id;
      }
      const result = await adminController.getUserById(id);
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send({
        ...serverError,
        error,
      });
    }
  }
);

// Update User API
routes.put(
  "/update-admin",
  upload.none(),
  authMiddleware.verifyToken,
  authMiddleware.checkAuth,
  async (req, res) => {
    try {
      const result = await adminController.updateUser({
        ...req.body
      });
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send(serverError);
    }
  }
);

// Update User API
routes.post(
  "/admin-forget-password",
  upload.none(),
  authMiddleware.checkFields(["userId", "password", "confirmPassword"]),
  authMiddleware.matchPassworrd,
  authMiddleware.checkPassword,
  async (req, res) => {
    try {
      const result = await adminController.forgetPass(req.body?.userId, req.body?.password);
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send(serverError);
    }
  }
);

// Change Password API
routes.post(
  "/change-admin-password",
  upload.none(),
  authMiddleware.checkFields(["otp", "id"]),
  async (req, res) => {
    try {
      const result = await adminController.changePassword({
        ...req.body
      });
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send(serverError);
    }
  }
);

// Update Profile Photo API
routes.put(
  "/update-admin-photo",
  upload.single("photo"),
  authMiddleware.verifyToken,
  async (req, res) => {
    try {
      let userId = req.headers?.userid ?? req.headers?.userId ?? req.headers?.id;
      const result = await adminController.changePhoto(userId, req.file);
      return res.status(result.status).send(result);
    } catch (error) {
      return res.status(serverError.status).send(serverError);
    }
  }
);

routes.delete("/delete-admin/:id", authMiddleware.verifyToken, authMiddleware.checkAuth, async (req, res) => {
  try {
    const result = await adminController.deleteUsers(req.params?.id);
    return res.status(result.status).send(result);
  } catch (err) {
    return res.status(serverError.status).send(serverError);
  }
});

export default routes;
