const { role } = require("../models");

const getAllRoles = async (req, res) => {
  try {
    const roles = await role.findAll();

    return res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error(
      "[Role] getAllRoles error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve roles.",
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const foundRole = await role.findById(req.params.id);

    if (!foundRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: foundRole,
    });
  } catch (error) {
    console.error(
      "[Role] getRoleById error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve role.",
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
};