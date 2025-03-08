import express from "express";
import Users from "../Controllers/Users.js";
import Auth from "../Utils/Middlewares.js";
import { upload } from "../Utils/Multer.js";
import { reqFields } from "../Utils/RequiredFields.js";
import { serverError } from "../Utils/Messages.js";

const routes = express.Router();
const users = new Users();
const authentication = new Auth();

// Get All Users
routes.get(
    "/get-users",
    authentication.verifyToken,
    authentication.checkAuth,
    async (req, res) => {
        try {
            const { page = 0, limit = 10 } = req.query;
            const result = await users.getUsers(page, parseInt(limit));
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// User Login API
routes.post(
    "/login",
    upload.none(),
    authentication.checkFields(["userId", "password"]),
    authentication.checkPassword,
    async (req, res) => {
        try {
            const result = await users.login(req, res);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// User Login with OTP
routes.post(
    "/verify-otp",
    upload.none(),
    authentication.checkFields(["userId", "otp"]),
    async (req, res) => {
        try {
            const result = await users.verifyOtp(req, res);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// User Registration API
routes.post(
    "/register-user",
    upload.none(),
    authentication.checkFields(reqFields.user),
    authentication.userExists,
    authentication.checkPassword,
    async (req, res) => {
        try {
            const result = await users.register(req.body);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Get User Members
routes.get(
    "/get-members",
    authentication.verifyToken,
    async (req, res) => {
        try {
            let userId = req.query?.userId ?? req.headers?.userid ?? req.headers?.userId;
            const result = await users.getMembers(userId);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Get User by ID API
routes.get(
    "/get-user-by-id",
    authentication.verifyToken,
    async (req, res) => {
        try {
            let userId = req.headers?.userid ?? req.headers?.userId;
            if (req.query?.userId) userId = req.query.userId;
            const result = await users.getUserById(userId);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Send OTP
routes.post(
    "/send-otp",
    upload.none(),
    authentication.checkFields(["userId"]),
    async (req, res) => {
        try {
            const result = await users.sendOtp(req.body.userId);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Update User API
routes.put(
    "/update-user",
    upload.none(),
    authentication.verifyToken,
    async (req, res) => {
        try {
            const result = await users.updateUser(req, res);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Update Profile Photo API
routes.put(
    "/update-profile-image",
    upload.single("image"),
    authentication.verifyToken,
    async (req, res) => {
        try {
            let userId = req.headers?.userid ?? req.headers?.userId ?? req.headers?.id;
            const result = await users.changePhoto(userId, req.file);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Change Password API
routes.put(
    "/change-password",
    upload.none(),
    authentication.verifyToken,
    authentication.checkFields(["userId", "password", "confirmPassword", "oldPassword"]),
    authentication.matchPassworrd,
    authentication.checkPassword,
    async (req, res) => {
        try {
            const result = await users.changePassword(req.body);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Delete User API
routes.delete(
    "/delete-user/:id",
    authentication.verifyToken,
    authentication.checkAuth,
    async (req, res) => {
        try {
            const result = await users.deleteUsers(req.params.id);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

// Verify OTP and Reset Password
routes.put(
    "/reset-password",
    authentication.checkFields(["userId", "newPassword", "confirmPassword"]),
    async (req, res) => {
        try {
            const result = await users.resetPassword(req, res);
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);

export default routes;
