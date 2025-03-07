import express from "express";
import Users from "../Controllers/Users.js";
import Auth from "../Utils/Middlewares.js";
import { upload } from "../Utils/Multer.js";
import { reqFields } from "../Utils/RequiredFields.js";
// import ifsc from "ifsc";

import { serverError } from "../Utils/Messages.js";

const routes = express.Router();

// Controllers
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
        users.login(req, res);
    }
);

// User Login with OTP
routes.post(
    "/verify-otp",
    upload.none(),
    authentication.checkFields(["userId", "otp"]),
    users.verifyOtp
);

// // User Registration API
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
            console.log(error)
            return res.status(serverError.status).send({
                ...serverError,
                error,
            });
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

// Activate connection and generate income
// routes.post(
//   "/activate-connection",
//   upload.none(),
//   authentication.verifyToken,
//   authentication.checkFields(["connectionId"]),
//   authentication.isValidUserId,
//   async (req, res) => {
//     try {
//       const result = await users.updateUsersIncome(
//         req.body
//       );
//       return res.status(result.status).send(result);
//     } catch (error) {
//       return res.status(serverError.status).send(serverError);
//     }
//   }
// );



// // Forget Password API
// routes.post(
//   "/forget-password",
//   upload.none(),
//   authentication.checkFields(["userId", "otp"]),
//   async (req, res) => {
//     try {
//       const result = await users.forgetPass(req.body?.userId, req.body?.otp);
//       return res.status(result.status).send(result);
//     } catch (error) {
//       return res.status(serverError.status).send(serverError);
//     }
//   }
// );

// // Get User by user Id API
routes.get(
    "/get-user-by-id/",
    authentication.verifyToken,
    async (req, res) => {
        try {
            let userId = req.headers?.userid ?? req.headers?.userId;
            if (req.query && req.query.hasOwnProperty("userId") && req.query?.userId) {
                userId = req.query?.userId;
            }
            const result = await users.getUserById(userId);
            res.status(result.status).send(result);
        } catch (error) {
            res.status(serverError.status).send({
                ...serverError,
                error,
            });
        }
    }
);
// send otp
routes.post(
    "/send-otp",
    upload.none(),
    authentication.checkFields(["userId"]), async (req, res) => {
        try {
            const { userId } = req.body;
            const result = await users.sendOtp(userId);
            return res.status(result.status).send(result);
        } catch (err) {
            console.log(err);
            return res.status(serverError.status).send(serverError);
        }
    }
);

// // Update User API
routes.put(
    "/update-user",
    upload.none(),
    authentication.verifyToken,
    async (req, res) => {
        try {
            await users.updateUser(req, res);
        } catch (error) {
            console.error("Error in /update-user route:", error);
            const msg = serverError;
            return res.status(msg.status).send(msg);
        }
    }
);


// routes.get("/ifsc-validate/:ifsc", async (req, res) => {
//   try {
//     if (req.params?.ifsc && ifsc.validate(req.params?.ifsc)) {
//       let result = await ifsc.fetchDetails(req.params?.ifsc);
//       return res.status(200).send({
//         status: 200,
//         data: result,
//       });
//     }
//     return res.status(noIfsc.status).send(noIfsc);
//   } catch (err) {
//     return res.status(serverError.status).send(serverError);
//   }
// });

// // Change Password API
// routes.put(
//   "/change-password",
//   upload.none(),
//   authentication.checkFields(["userId", "password", "confirmPassword"]),
//   authentication.matchPassworrd,
//   authentication.checkPassword,
//   async (req, res) => {
//     try {
//       const result = await users.changePassword(req.body);
//       return res.status(result.status).send(result);
//     } catch (error) {
//       return res.status(serverError.status).send(serverError);
//     }
//   }
// );

// // Update Profile Photo API
routes.put(
    "/update-profile-image",
    upload.single("image"),
    authentication.verifyToken,
    async (req, res) => {
        try {
            let userId = req.headers?.userid ?? req.headers?.userId ?? req.headers?.id;
            const result = await users.changePhoto(userId, req.file)
            return res.status(result.status).send(result);
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    }
);
// change password
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
// delete user
routes.delete("/delete-user/:id", authentication.verifyToken, authentication.checkAuth, async (req, res) => {
    try {
        const result = await users.deleteUsers(req?.params?.id);
        return res.status(result.status).send(result);
    } catch (err) {
        return res.status(serverError.status).send(serverError);
    }
});
// verify otp and reset password
routes.put(
    "/reset-password",
    authentication.checkFields(["userId", "newPassword", "confirmPassword"]),
    users.resetPassword
);


export default routes;
