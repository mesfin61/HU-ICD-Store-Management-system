const express = require("express");
const { protect, restrictToExact, ROLES } = require("../middleware/AuthMiddleware");
const {
	getInventoryReport,
	getTransactionReport,
	getRequestReport,
	getIssuanceReport,
	getReturnReport,
} = require("../controllers/reportController");

const router = express.Router();

router.use(protect);

router.get("/inventory", restrictToExact("Store Manager"), getInventoryReport);
router.get(
	"/transactions",
	restrictToExact("Store Manager"),
	getTransactionReport,
);
router.get("/requests", restrictToExact(ROLES.DIRECTORATE), getRequestReport);
router.get("/issuances", restrictToExact("Store Manager"), getIssuanceReport);
router.get("/returns", restrictToExact("Store Manager"), getReturnReport);

module.exports = router;