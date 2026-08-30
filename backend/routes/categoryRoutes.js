const express = require("express");

const {
  protect,
} = require("../middleware/AuthMiddleware");

const {
  getAllCategories,
} = require("../controllers/categoryController");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  getAllCategories,
);

module.exports = router;