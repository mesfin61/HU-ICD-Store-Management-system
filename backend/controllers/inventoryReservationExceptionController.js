const { inventoryReservationException } = require("../models");

// =========================================================
// ADMINISTRATOR: OPEN EXCEPTIONS
// =========================================================

const getOpenExceptions = async (req, res) => {
  try {
    const exceptions = await inventoryReservationException.findOpen();

    return res.status(200).json({
      success: true,
      count: exceptions.length,
      data: exceptions,
    });
  } catch (error) {
    console.error("[ReservationException] getOpenExceptions:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// ADMINISTRATOR: GET ONE
// =========================================================

const getException = async (req, res) => {
  try {
    const exception = await inventoryReservationException.findById(
      req.params.id,
    );

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: "Reservation exception not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: exception,
    });
  } catch (error) {
    console.error("[ReservationException] getException:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// ADMINISTRATOR: APPROVE
// =========================================================

const approveException = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;

    const exception = await inventoryReservationException.approve({
      exceptionId: req.params.id,
      administratorId: req.user.id,
      resolutionNotes,
    });

    return res.status(200).json({
      success: true,
      message: "Reservation exception approved and resolved.",
      data: exception,
    });
  } catch (error) {
    console.error("[ReservationException] approveException:", error);

    const errors = {
      EXCEPTION_NOT_FOUND: [404, "Reservation exception not found."],

      EXCEPTION_ALREADY_RESOLVED: [
        409,
        "This reservation exception has already been resolved.",
      ],

      EXCEPTION_ALREADY_DECIDED: [
        409,
        "This reservation exception has already been decided.",
      ],

      RESERVATION_NOT_FOUND: [404, "Reservation not found."],

      RESERVATION_NOT_ACTIVE: [
        409,
        "The affected reservation is no longer active.",
      ],

      RESERVATION_QUANTITY_INCONSISTENT: [
        409,
        "Reservation quantity is inconsistent with the exception.",
      ],

      ITEM_NOT_FOUND: [404, "Inventory item not found."],

      ITEM_INACTIVE: [400, "Inventory item is inactive."],

      INSUFFICIENT_PHYSICAL_STOCK: [
        409,
        "Physical stock is insufficient to resolve this exception.",
      ],
    };

    const known = errors[error.message];

    if (known) {
      return res.status(known[0]).json({
        success: false,
        message: known[1],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// ADMINISTRATOR: REJECT
// =========================================================

const rejectException = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;

    if (typeof resolutionNotes !== "string" || !resolutionNotes.trim()) {
      return res.status(400).json({
        success: false,
        message: "A reason for rejecting the exception is required.",
      });
    }

    const exception = await inventoryReservationException.reject({
      exceptionId: req.params.id,
      administratorId: req.user.id,
      resolutionNotes,
    });

    return res.status(200).json({
      success: true,
      message: "Reservation exception rejected.",
      data: exception,
    });
  } catch (error) {
    console.error("[ReservationException] rejectException:", error);

    const errors = {
      EXCEPTION_NOT_FOUND: [404, "Reservation exception not found."],

      EXCEPTION_ALREADY_RESOLVED: [
        409,
        "This reservation exception has already been resolved.",
      ],

      EXCEPTION_ALREADY_DECIDED: [
        409,
        "This reservation exception has already been decided.",
      ],
    };

    const known = errors[error.message];

    if (known) {
      return res.status(known[0]).json({
        success: false,
        message: known[1],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = {
  getOpenExceptions,
  getException,
  approveException,
  rejectException,
};
