const express = require("express");

const { protect, restrictTo, ROLES } = require("../middleware/AuthMiddleware");

const { getAllRoles, getRoleById } = require("../controllers/roleController");

const router = express.Router();

router.use(protect);

router.use(restrictTo(ROLES.ADMINISTRATOR));

router.get("/", getAllRoles);

router.get("/:id", getRoleById);

module.exports = router;
