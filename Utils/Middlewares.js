import { ObjectId } from "mongodb";
import { alreadyExist, expired, invalidFormat, invalidId, limitExceeded, noAccess, notFound, notMatched, noToken, notVerified, requiredFields, serverError, limitedSuperAdmin } from "./Messages.js";
import jwt from "jsonwebtoken";
import collections from "./Collection.js";
import bcrypt from 'bcrypt';
class Auth {
    // UserExist with user Id or not
    isValidUserId = async (req, res, next) => {
        let userId = req.body.userId ??
            req.headers?.userid ??
            req.headers?.userId;
        try {
            if (userId === null || userId === undefined) {
                let msg = notFound("User Id");
                return res.status(msg.status).send(msg);
            }
            let value = userId.toLowerCase();
            const result = await collections.users().findOne({
                $or: [{ userId: value }, { email: value }],
            });

            if (result && result.userId) {
                req.body.userId = result?.userId;
                req.body.type = result.type;
                return next();
            } else {
                let msg = notFound("User Id");
                return res.status(msg.status).send(msg);
            }
        } catch (err) {
            console.log(err);
            return res.status(serverError.status).send(serverError);
        }
    };

    // check if client is Admin
    checkAuth = async (req, res, next) => {
        try {
            const userId =
                req.headers?.id ?? req.headers?.Id ?? req.headers.userId ?? req.headers.userid;
            if (userId !== null && userId !== undefined) {
                // Source Admin types to check if user is valid auth
                const source = await collections.settings().findOne({
                    type: "admin-types",
                });
                const user = await collections.admins().findOne({ _id: new ObjectId(userId) });
                const adminType = source?.value ?? "";
                if (adminType.includes(user?.type)) {
                    return next();
                } else {
                    if (user?.type === "super-admin") {
                        return next();
                    } else {
                        return res.status(noAccess.status).send(noAccess);
                    }
                };
            } else {
                return res.status(idNotFound.status).send(idNotFound);
            }
        } catch (err) {
            console.log(err);
            return res.status(serverError.status).send(serverError);
        }
    };

    // Check if user already exists with same email
    userExists = async (req, res, next) => {
        try {
            const { phone } = req.body;
            let email = req.body?.email?.toLowerCase();
            // Check if user with the same email exists or having account more than 10 with the same number
            const countUser = await collections.users().countDocuments({
                email: email
            });
            if (countUser > 0) {
                let msg = alreadyExist("User");
                return res.status(msg.status).send(msg);
            }
            // Check if more than 10 users with the same mobile number exist
            const countMobile = await collections.users().countDocuments({
                phone: phone
            });
            if (countMobile > 3) {
                let msg = limitExceeded("mobile no");
                return res.status(msg.status).send(msg);
            }
            next();
        } catch (err) {
            return res.status(serverError.status).send(serverError);
        }
    };

    adminExists = async (req, res, next) => {
        try {
            const { phone } = req.body;
            const { type } = req.body;
            const email = req.body?.email.toLowerCase();
            // Check if user with the same email exists or having account more than 10 with the same number
            const countUser = await collections.admins().countDocuments({
                email: email
            });
            if (countUser > 0) {
                let msg = alreadyExist("Given Email")
                return res.status(msg.status).send(msg);
            }
            // Check if more than 10 users with the same mobile number exist
            const countMobile = await collections.admins().countDocuments({
                phone: phone
            });
            if (countMobile > 10) {
                let msg = limitExceeded("mobile no");
                return res.status(msg.status).send(msg);
            }
            const countSuperAdmin = await collections.admins().countDocuments({
                type: type
            });
            if (countSuperAdmin > 0) {
                let msg = limitedSuperAdmin()
                return res.status(msg.status).send(msg)

            }
            return next();
        } catch (err) {
            return res.status(serverError.status).send(serverError);
        }
    };

    // Check if provided id is valid Object Id
    CheckObjectId = async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) {
                let msg = invalidId("Credentials");
                return res.status(msg.status).send(msg);
            }
            next();
        } catch (error) {
            return res.status(serverError.status).send(serverError);
        }
    };

    // Verify if authorized token is valid
    async verifyToken(req, res, next) {
        try {
            const token =
                req.headers?.authorization?.split(" ")[1] ||
                req.cookies?.authToken;
            const userId =
                req.headers?.userid ??
                req.headers?.userId;
            if (userId === null || !token || token === undefined) {
                return res.status(noToken.status).send(noToken);
            }
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err || decoded?.id !== userId) {
                    return res.status(expired.status).send(expired);
                }
                return next();
            });
        } catch (err) {
            return res.status(serverError.status).send(serverError);
        }
    }

    async verifyUser(req, res, next) {
        try {
            const user = collections.users().findOne({ userId: req.body?.userId });
            if (user && user?.isVerified) {
                return next()
            } else {
                return res.status(notVerified.status).send(notVerified);
            }
        } catch (err) {
            return res.status(serverError.status).send(serverError);

        }
    }

    // check if body contains required fields
    checkFields(fields) {
        return async (req, res, next) => {
            const missingFields = fields.filter((field) => !req.body[field]);
            if (missingFields.length > 0) {
                let msg = requiredFields(missingFields);
                return res.status(msg.status).send(msg);
            }
            next();
        };
    }

    // check if body contains required files
    checkFiles(fields) {
        return async (req, res, next) => {
            const missingFiles = await fields.filter((file) => !req.files?.[file]);
            if (missingFiles.length > 0) {
                let msg = requiredFields(missingFiles);
                return res.status(msg.status).send(msg);
            }
            next();
        };
    }

    // check password and confirm password
    matchPassworrd = (req, res, next) => {
        if (req.body?.password === req.body?.confirmPassword) {
            return next();
        } else {
            return res.status(notMatched.status).send(notMatched);
        }
    }
 
    // Check password pattern
    checkPassword = (req, res, next) => {
        const passwordPattern =
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
        if (!passwordPattern.test(req.body.password) && req.body.password?.length < 8) {
            return res.status(invalidFormat.status).send(invalidFormat);
        }
        next();
    };

    // hash password
    hashPassword = async (password) => {
        try {
            const rounds = 10;
            const hashedPassword = await bcrypt.hash(password, rounds);
            return hashedPassword;

        } catch (err) {
            console.log("error in password encryption", err);
        }
    }
    ComparePassword = async (password, hashedPassword) => {
        return bcrypt.compare(password, hashedPassword);
    };
    createOrderId = async () => {

    }


}

export default Auth;
