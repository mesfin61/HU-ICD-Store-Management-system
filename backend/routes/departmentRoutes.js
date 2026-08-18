const express = require("express");

const {
  protect,
  restrictTo,
} = require("../middleware/AuthMiddleware");

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  activateDepartment,
} = require("../controllers/departmentController");

const router = express.Router();

/*
 * Every department endpoint requires authentication.
 */
router.use(protect);

/*
 * Read operations:
 * Super Admin and admin can view departments.
 *
 * The normal user does not need access to the
 * administrative department-management API.
 */
router.get(
  "/",
  restrictTo("Super Admin", "admin"),
  getAllDepartments,
);

router.get(
  "/:id",
  restrictTo("Super Admin", "admin"),
  getDepartmentById,
);

/*
 * Department administration:
 * Only Super Admin can create, modify, activate,
 * or deactivate institutional departments.
 */
router.post(
  "/",
  restrictTo("Super Admin"),
  createDepartment,
);

router.patch(
  "/:id",
  restrictTo("Super Admin"),
  updateDepartment,
);

router.patch(
  "/:id/deactivate",
  restrictTo("Super Admin"),
  deactivateDepartment,
);

router.patch(
  "/:id/activate",
  restrictTo("Super Admin"),
  activateDepartment,
);

module.exports = router;