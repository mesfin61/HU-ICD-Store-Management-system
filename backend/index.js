require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const departmentRoutes = require("./routes/departmentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/*
 * CORS
 */
app.use(
  cors({
    origin: process.env.VITE_API,
    credentials: true,
  }),
);

/*
 * Static uploads
 */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")),
);

/*
 * Request parsing
 */
app.use(express.json());
app.use(cookieParser());

/*
 * API routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/departments", departmentRoutes);

/*
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});