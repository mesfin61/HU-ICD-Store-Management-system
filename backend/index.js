require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const requestRoutes = require("./routes/requestRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const inventoryReservationRoutes = require(
  "./routes/inventoryReservationRoutes",
);
const issuanceRoutes = require(
  "./routes/issuanceRoutes",
);
const itemReturnRoutes = require(
  "./routes/itemReturnRoutes",
);
const auditLogRoutes = require(
  "./routes/auditLogRoutes",
);

const inventoryReservationExceptionRoutes =
  require(
    "./routes/inventoryReservationExceptionRoutes", 
);

const notificationRoutes = require(
  "./routes/notificationRoutes",
);

const categoryRoutes = require(
  "./routes/categoryRoutes",
);

const messageRoutes =
  require("./routes/messageRoutes");





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
app.use("/api/requests", requestRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use(
  "/api/inventory-reservations",
  inventoryReservationRoutes,
);
app.use(
  "/api/issuance",
  issuanceRoutes,
);
app.use(
  "/api/item-returns",
  itemReturnRoutes,
);
app.use(
  "/api/audit-logs",
  auditLogRoutes,
);
app.use(
  "/api/inventory-reservation-exceptions",
  inventoryReservationExceptionRoutes,
);
app.use(
  "/api/notifications",
  notificationRoutes,
);
app.use(
  "/api/categories",
  categoryRoutes,
);

app.use(
  "/api/messages",
  messageRoutes,
);


/*
 * Start server
 */

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});