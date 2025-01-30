import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import usersRoutes from "./Routes/User.js";
import adminRoutes from "./Routes/Admin.js";
import settingsRoutes from "./Routes/Settings.js";
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
// handling the error when no routes are found
app.all("*", (req, res, next) => {
  res.status(404).send(urlNotFound);
});
export default app;
