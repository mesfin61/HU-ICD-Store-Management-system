const bcrypt = require("bcryptjs");
const { user, role, department } = require("../models");

const SUPER_ADMIN = "Super Admin";
const ADMIN = "admin";
const USER = "user";

const getAllUsers = async (req, res) => {
  try {
    const users = await user.findAll();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("[User] getAllUsers error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const foundUser = await user.findById(req.params.id);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: foundUser,
    });
  } catch (error) {
    console.error("[User] getUserById error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, email, password, departmentId, roleId } = req.body;

    if (!fullName || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await user.findByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user already exists with this email.",
      });
    }

    const requestedRole = await role.findById(roleId);

    if (!requestedRole) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }

    const requestedDepartment =
    await department.findById(departmentId);

    if (!requestedDepartment) {
      return res.status(400).json({
        success: false,
        message: "Invalid department.",
      });
    }

    if (!requestedDepartment.is_active) {
      return res.status(400).json({
        success: false,
        message: "The selected department is inactive.",
      });
    }

    /*
     * ADMIN RULE:
     *
     * Admins may create ordinary users only.
     */
    if (req.user.role_name === ADMIN && requestedRole.name !== USER) {
      return res.status(403).json({
        success: false,
        message: "Admins can only create standard users.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await user.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      roleId: requestedRole.id,
      departmentId: requestedDepartment.id,
    });

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error("[User] createUser error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, email, roleId, departmentId, isActive } = req.body;
    const { id } = req.params;

    const existingUser = await user.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    /*
     * Never allow a user to modify their own
     * privileged role or account status.
     */
    if (
      id === req.user.id &&
      (roleId !== undefined || isActive !== undefined)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot change your own role or account status.",
      });
    }

    /*
     * Admins can only modify standard users.
     */
    if (req.user.role_name === ADMIN) {
      if (existingUser.role_name !== USER) {
        return res.status(403).json({
          success: false,
          message: "Admins can only modify standard users.",
        });
      }

      /*
       * Admins cannot assign privileged roles.
       */
      if (roleId !== undefined) {
        const requestedRole = await role.findById(roleId);

        if (!requestedRole) {
          return res.status(400).json({
            success: false,
            message: "Invalid role.",
          });
        }

        if (requestedRole.name !== USER) {
          return res.status(403).json({
            success: false,
            message:
              "Admins cannot promote users to privileged roles.",
          });
        }
      }
    }

    /*
     * Determine final values before sending the
     * operation to the transactional model method.
     */
    const finalFullName =
      fullName ?? existingUser.full_name;

    const finalEmail =
      email
        ? email.trim().toLowerCase()
        : existingUser.email;

    const finalRoleId =
      roleId ?? existingUser.role_id;

    const finalIsActive =
      isActive !== undefined
        ? isActive
        : existingUser.is_active;

    /*
     * Check email uniqueness.
     */
    if (finalEmail !== existingUser.email) {
      const emailTaken =
        await user.findByEmail(finalEmail);

      if (emailTaken && emailTaken.id !== id) {
        return res.status(400).json({
          success: false,
          message:
            "Email is already in use by another user.",
        });
      }
    }

      const finalDepartmentId =
        departmentId !== undefined
          ? departmentId
          : existingUser.department_id;
      
      if (departmentId !== undefined) {
        const requestedDepartment =
          await department.findById(departmentId);

      if (!requestedDepartment) {
        return res.status(400).json({
          success: false,
          message: "Invalid department.",
        });
      }

      if (!requestedDepartment.is_active) {
        return res.status(400).json({
          success: false,
          message: "The selected department is inactive.",
        });
      }
}    



    /*
     * The database transaction now owns all
     * Super Admin integrity decisions.
     */
    const result =
      await user.updateWithSuperAdminGuard({
        id,
        actingUserId: req.user.id,
        fullName: finalFullName.trim(),
        email: finalEmail,
        roleId: finalRoleId,
        isActive: finalIsActive,
        departmentId: finalDepartmentId,
      });

    if (!result.success) {
      switch (result.reason) {
        case "NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });

        case "INVALID_ROLE":
          return res.status(400).json({
            success: false,
            message: "Invalid role.",
          });

        case "LAST_SUPER_ADMIN":
          return res.status(400).json({
            success: false,
            message:
              "The system must always have at least one active Super Admin.",
          });

        case "SELF_PRIVILEGE_CHANGE":
          return res.status(403).json({
            success: false,
            message:
              "You cannot change your own role or account status.",
          });

        default:
          return res.status(400).json({
            success: false,
            message: "User update was rejected.",
          });
      }
    }

    return res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    console.error(
      "[User] updateUser error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const foundUser = await user.findById(id);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    /*
     * Admins can only deactivate standard users.
     */
    if (
      req.user.role_name === ADMIN &&
      foundUser.role_name !== USER
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admins can only deactivate standard users.",
      });
    }

    const result =
      await user.deactivateWithSuperAdminGuard({
        id,
        actingUserId: req.user.id,
      });

    if (!result.success) {
      switch (result.reason) {
        case "SELF_DEACTIVATION":
          return res.status(400).json({
            success: false,
            message:
              "You cannot deactivate your own account.",
          });

        case "ALREADY_INACTIVE":
          return res.status(400).json({
            success: false,
            message: "User is already inactive.",
          });

        case "LAST_SUPER_ADMIN":
          return res.status(400).json({
            success: false,
            message:
              "The last active Super Admin cannot be deactivated.",
          });

        case "NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });

        default:
          return res.status(400).json({
            success: false,
            message: "Deactivation was rejected.",
          });
      }
    }

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully.",
      data: result.user,
    });
  } catch (error) {
    console.error(
      "[User] deactivateUser error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};
const deleteUser = async (req, res) => {
  /*
   * Hard deletion of users is intentionally disabled.
   *
   * Users are referenced by requests, assets and
   * inventory transactions. Deactivation preserves
   * historical records and is the correct lifecycle
   * operation.
   */
  return res.status(405).json({
    success: false,
    message:
      "User deletion is disabled. Deactivate the user instead.",
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
};