const bcrypt = require("bcryptjs");
const { user } = require("../models");

function initialsFromEmail(email) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const getAllUsers = async (req, res) => {
  try {
    const users = await user.findAll();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("[User] getAllUsers error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getUserById = async (req, res) => {
  try {
    const foundUser = await user.findById(req.params.id);

    if (!foundUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, data: foundUser });
  } catch (error) {
    console.error("[User] getUserById error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, email, password, roleId } = req.body;

    if (!fullName || !email || !password || !roleId) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required!!" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const existingUser = await user.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "user already exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const NewUser = await user.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      roleId,
    });

    res.status(201).json({ success: true, data: NewUser });
  } catch (error) {
    console.error("[User] createUser error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, email, roleId, isActive } = req.body;

    const { id } = req.params;
    const existingUser = await user.findById(id);
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (email && email.trim().toLowerCase() !== existingUser.email) {
      const emailTaken = await user.findByEmail(email.trim().toLowerCase());
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another user.",
        });
      }
    }

    const updated = await user.update(id, {
      fullName: fullName ?? existingUser.full_name,
      email: email ? email.trim().toLowerCase() : existingUser.email,
      roleId: roleId ?? existingUser.role_id,
      isActive: isActive !== undefined ? isActive : existingUser.is_active,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("[User] updateUser error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating their own account
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    const foundUser = await user.findById(id);
    if (!foundUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const result = await user.deactivate(id);

    res.status(200).json({
      success: true,
      message: "User deactivated successfully.",
      data: result,
    });
  } catch (err) {
    console.error("[User] deactivateUser error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const foundUser = await user.findById(id);
    if (!foundUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    await user.delete(id);

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    console.error("[User] deleteUser error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
};
