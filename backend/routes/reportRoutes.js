const express = require("express");
const { protect, restrictToExact } = require("../middleware/AuthMiddleware");
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
router.get("/requests", restrictToExact("Super Admin"), getRequestReport);
router.get("/issuances", restrictToExact("Store Manager"), getIssuanceReport);
router.get("/returns", restrictToExact("Store Manager"), getReturnReport);

module.exports = router;