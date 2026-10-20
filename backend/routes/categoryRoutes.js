const express = require("express");

const { protect, restrictToExact } = require("../middleware/AuthMiddleware");

const {
  getAllCategories,
  CreateCategories,
  updateCategory,
  deactivateCategory,
  activateCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.use(protect);

router.get("/", getAllCategories);

router.post(
  "/create-category",
  restrictToExact("Store Manager", "Administrator"),
  CreateCategories,
);

router.patch(
  "/:id",
  restrictToExact("Store Manager", "Administrator"),
  updateCategory,
);

router.patch(
  "/:id/deactivate",
  restrictToExact("Store Manager", "Administrator"),
  deactivateCategory,
);

router.patch(
  "/:id/activate",
  restrictToExact("Store Manager", "Administrator"),
  activateCategory,
);

module.exports = router;
