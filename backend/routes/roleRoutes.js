const express = require("express");

const { protect, restrictTo } = require("../middleware/AuthMiddleware");

const { getAllRoles, getRoleById } = require("../controllers/roleController");

const router = express.Router();

router.use(protect);

router.use(restrictTo("Super Admin"));

router.get("/", getAllRoles);

router.get("/:id", getRoleById);

module.exports = router;
