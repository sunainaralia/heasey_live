import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import usersRoutes from "./Routes/User.js";
import adminRoutes from "./Routes/Admin.js";
import settingsRoutes from "./Routes/Settings.js";
import categoryRoutes from "./Routes/Category.js";
import productRoutes from "./Routes/Products.js";
import carouselRoutes from "./Routes/Carousel.js";
import reviewRoutes from "./Routes/Reviews.js";
import orderRoutes from "./Routes/Orders.js";
import rewardRoutes from "./Routes/Rewards.js";
import couponRoutes from "./Routes/Coupons.js";
import queryRoutes from "./Routes/Query.js";
import replyRoutes from "./Routes/Replies.js";
import feedbackRoutes from "./Routes/Feedbacks.js";
import cartRoutes from "./Routes/Cart.js";
import ratingRoutes from "./Routes/Ratings.js";
import distributionRoutes from "./Routes/Distribution.js";
import transactionRoutes from "./Routes/Transactions.js";
import appReviewRoutes from "./Routes/AppReview.js";
import kycRoutes from "./Routes/Kyc.js";
import cancelOrderRoutes from "./Routes/CancelOrder.js";
import addressRoutes from "./Routes/Address.js";
import incomeRoutes from "./Routes/Incomes.js";
import path from "path";
import { fileURLToPath } from "url";
import { urlNotFound } from "./Utils/Messages.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/", usersRoutes);
app.use("/api/v1/", adminRoutes);
app.use("/api/v1/", adminRoutes);
app.use("/api/v1", settingsRoutes);
app.use("/api/v1/", categoryRoutes);
app.use("/api/v1/", productRoutes);
app.use("/api/v1/", carouselRoutes);
app.use("/api/v1/", reviewRoutes);
app.use("/api/v1/", orderRoutes);
app.use("/api/v1/", rewardRoutes);
app.use("/api/v1/", couponRoutes);
app.use("/api/v1/", queryRoutes);
app.use("/api/v1/", replyRoutes);
app.use("/api/v1/", feedbackRoutes);
app.use("/api/v1/", cartRoutes);
app.use("/api/v1/", ratingRoutes);
app.use("/api/v1/", distributionRoutes);
app.use("/api/v1/", transactionRoutes);
app.use("/api/v1/", appReviewRoutes);
app.use("/api/v1/", kycRoutes);
app.use("/api/v1/", cancelOrderRoutes);
app.use("/api/v1/", addressRoutes);
app.use("/api/v1/", incomeRoutes);

// handling the error when no routes are found
app.all("*", (req, res, next) => {
  res.status(404).send(urlNotFound);
});
export default app;
