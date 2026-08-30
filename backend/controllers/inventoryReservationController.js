const {
  inventoryReservation,
  request,
} = require("../models");

const inventoryReservationController = {
  // =========================================================
  // GET RESERVATIONS FOR REQUEST
  //
  // Reservation creation is NOT exposed.
  //
  // Reservations are automatically created when an
  // Administrator approves a request.
  // =========================================================

  async getByRequest(req, res) {
    try {
      const { requestId } = req.params;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "Request ID is required.",
        });
      }

      const foundRequest =
        await request.findById(requestId);

      if (!foundRequest) {
        return res.status(404).json({
          success: false,
          message: "Request not found.",
        });
      }

      const isAdministrator =
        req.user.role_name === "Administrator";

      const isStoreManager =
        req.user.role_name === "Store Manager";

      const isRequester =
        foundRequest.requester_id === req.user.id;

      // -------------------------------------------------------
      // Staff can only see their own reservations.
      // -------------------------------------------------------

      if (
        !isAdministrator &&
        !isStoreManager &&
        !isRequester
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      // -------------------------------------------------------
      // Store Manager should only access reservations that
      // are relevant to issuance.
      // -------------------------------------------------------

      if (
        isStoreManager &&
        foundRequest.status !== "APPROVED" &&
        foundRequest.status !== "PARTIALLY_APPROVED"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This request is not available for issuance.",
        });
      }

      const reservations =
        await inventoryReservation.findByRequestId(
          requestId,
        );

      return res.status(200).json({
        success: true,
        count: reservations.length,
        data: reservations,
      });
    } catch (error) {
      console.error(
        "[Inventory Reservation] getByRequest error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },
};

module.exports = inventoryReservationController;