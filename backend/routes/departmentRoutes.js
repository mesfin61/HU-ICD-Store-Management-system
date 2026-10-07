const express = require("express");

const { protect, restrictTo, ROLES } = require("../middleware/AuthMiddleware");

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
 * Administrators can view departments.
 *
 * The normal user does not need access to the
 * administrative department-management API.
 */
router.get("/", restrictTo(ROLES.ADMINISTRATOR), getAllDepartments);
router.get("/:id", restrictTo(ROLES.ADMINISTRATOR), getDepartmentById);

/*
 * Department administration:
 * Only Administrators can create, modify, activate,
 * or deactivate institutional departments.
 */
router.post("/", restrictTo(ROLES.ADMINISTRATOR), createDepartment);
router.patch("/:id", restrictTo(ROLES.ADMINISTRATOR), updateDepartment);

router.patch(
  "/:id/deactivate",
  restrictTo(ROLES.ADMINISTRATOR),
  deactivateDepartment,
);

router.patch("/:id/activate", restrictTo(ROLES.ADMINISTRATOR), activateDepartment);

module.exports = router;
