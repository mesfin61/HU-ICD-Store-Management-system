const bcrypt = require("bcryptjs");
const { sendWelcomeEmail } = require("../utils/email");
const { user, role, department, auditLog } = require("../models");

const { ROLES, isAdministratorRole } = require("../middleware/AuthMiddleware");

const getAllUsers = async (req, res) => {
  try {
    const users = await user.findAll();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("[User] getAllUsers error:", error.message);

    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: foundUser,
    });
  } catch (error) {
    console.error("[User] getUserById error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, email, password, departmentId, roleId } = req.body;

    /*
     * This controller is Administrator-only.
     * The route should also enforce this restriction.
     * This second check is intentional defense in depth.
     */
    if (!isAdministratorRole(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

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

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
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
      });
    }

    /*
     Only the three application roles are valid. 
     */
    
    const validRoles = Object.values(ROLES);

    if (!validRoles.includes(requestedRole.name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const requestedDepartment = await department.findById(departmentId);

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

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await user.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      roleId: requestedRole.id,
      departmentId: requestedDepartment.id,
    });

    await auditLog.create({
      userId: req.user.id,
      action: "USER_CREATED",
      entityName: "users",
      entityId: newUser.id,
      newData: {
        fullName: newUser.full_name,
        email: newUser.email,
        role: requestedRole.name,
        department: requestedDepartment.name,
      },
    });

    let emailSent = true;

    try {
      await sendWelcomeEmail({
        recipientEmail: newUser.email,
        recipientName: newUser.full_name,
        roleName: requestedRole.name,
        initialPassword: password,
      });
    } catch (emailError) {
      emailSent = false;

      console.error("[User] Welcome email failed:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? "User created successfully and welcome email sent."
        : "User created successfully, but the welcome email could not be sent.",
      emailSent,
      data: newUser,
    });
  } catch (error) {
    console.error("[User] createUser error:", error);

    if (error.message === "SUPER_ADMIN_LIMIT") {
      return res.status(400).json({
        success: false,
        message: "The system allows a maximum of two Super Admin accounts.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, email, roleId, departmentId, isActive } = req.body;

    const { id } = req.params;

    /*
     * Defense in depth.
     */
    if (!isAdministratorRole(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const existingUser = await user.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    /*
     * An Administrator cannot modify their own
     * role or activation state.
     */
    if (
      id === req.user.id &&
      (roleId !== undefined || isActive !== undefined)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role or account status.",
      });
    }

    /*
     * Validate requested role before calculating
     * the final user state.
     */
    let finalRoleId = existingUser.role_id;

    if (roleId !== undefined) {
      const requestedRole = await role.findById(roleId);

      if (!requestedRole) {
        return res.status(400).json({
          success: false,
          message: "Invalid role.",
        });
      }

      if (!Object.values(ROLES).includes(requestedRole.name)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role.",
        });
      }

      finalRoleId = requestedRole.id;
    }

    /*
     * Determine final values.
     */
    const finalFullName =
      fullName !== undefined ? fullName.trim() : existingUser.full_name;

    const finalEmail =
      email !== undefined ? email.trim().toLowerCase() : existingUser.email;

    const finalIsActive =
      isActive !== undefined ? isActive : existingUser.is_active;

    const finalDepartmentId =
      departmentId !== undefined ? departmentId : existingUser.department_id;

    /*
     * Validate email uniqueness.
     */
    if (finalEmail !== existingUser.email) {
      const emailTaken = await user.findByEmail(finalEmail);

      if (emailTaken && emailTaken.id !== id) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another user.",
        });
      }
    }

    /*
     * Department must be valid and active.
     */
    if (departmentId !== undefined) {
      const requestedDepartment = await department.findById(departmentId);

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
     * Delegate integrity-sensitive changes to the model.
     * The model method must enforce the Administrator
     * protection rules transactionally.
     */
    const result = await user.updateWithAdministratorGuard({
      id,
      actingUserId: req.user.id,
      fullName: finalFullName,
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

        case "LAST_ADMINISTRATOR":
          return res.status(400).json({
            success: false,
            message:
              "The system must always have at least one active Administrator.",
          });

        case "SUPER_ADMIN_LIMIT":
          return res.status(400).json({
            success: false,
            message: "The system allows a maximum of two Super Admin accounts.",
          });

        case "SELF_PRIVILEGE_CHANGE":
          return res.status(403).json({
            success: false,
            message: "You cannot change your own role or account status.",
          });

        default:
          return res.status(400).json({
            success: false,
            message: "User update was rejected.",
          });
      }
    }

    await auditLog.create({
      userId: req.user.id,
      action: "USER_UPDATED",
      entityName: "users",
      entityId: id,
      oldData: {
        fullName: existingUser.full_name,
        email: existingUser.email,
        roleId: existingUser.role_id,
        departmentId: existingUser.department_id,
        isActive: existingUser.is_active,
      },
      newData: {
        fullName: finalFullName,
        email: finalEmail,
        roleId: finalRoleId,
        departmentId: finalDepartmentId,
        isActive: finalIsActive,
      },
    });

    return res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    console.error("[User] updateUser error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const transferOwnership = async (req, res) => {
  try {
    const { currentPassword } = req.body;

    if (req.user.role_name !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only a Super Admin can transfer ownership.",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Your current password is required.",
      });
    }

    const authenticatedUser = await user.findByEmail(req.user.email);
    const passwordMatches = authenticatedUser?.password_hash
      ? await bcrypt.compare(currentPassword, authenticatedUser.password_hash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Your current password is incorrect.",
      });
    }

    const targetUser = await user.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found.",
      });
    }

    const result = await user.transferOwnership({
      actingUserId: req.user.id,
      targetUserId: req.params.id,
    });

    if (!result.success) {
      switch (result.reason) {
        case "INVALID_TRANSFER":
          return res.status(400).json({
            success: false,
            message: "A different target user is required.",
          });

        case "NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Target user not found.",
          });

        case "NOT_AUTHORIZED":
          return res.status(403).json({
            success: false,
            message: "Only the current Super Admin can transfer ownership.",
          });

        case "TARGET_INACTIVE":
          return res.status(400).json({
            success: false,
            message: "Ownership cannot be transferred to an inactive user.",
          });

        case "INVALID_ROLE_CONFIGURATION":
          return res.status(500).json({
            success: false,
            message: "Required ownership roles are not configured.",
          });

        default:
          return res.status(400).json({
            success: false,
            message: "Ownership transfer was rejected.",
          });
      }
    }

    await auditLog.create({
      userId: req.user.id,
      action: "OWNERSHIP_TRANSFERRED",
      entityName: "users",
      entityId: targetUser.id,
      oldData: {
        previousOwnerId: req.user.id,
        previousOwnerRole: ROLES.SUPER_ADMIN,
        targetUserRole: targetUser.role_name,
      },
      newData: {
        previousOwnerId: req.user.id,
        previousOwnerRole: ROLES.STORE_MANAGER,
        newOwnerId: targetUser.id,
        newOwnerRole: ROLES.SUPER_ADMIN,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ownership transferred successfully.",
      data: result,
    });
  } catch (error) {
    console.error("[User] transferOwnership error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const foundUser = await user.findPasswordHashById(id);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      foundUser.password_hash,
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updatedPassword = await user.updatePassword(id, passwordHash);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
      data: updatedPassword,
    });
  } catch (error) {
    console.log("[User] changePassword error:", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    /*
     * Defense in depth.
     */
    if (!isAdministratorRole(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const foundUser = await user.findById(id);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const result = await user.deactivateWithAdministratorGuard({
      id,
      actingUserId: req.user.id,
    });

    if (!result.success) {
      switch (result.reason) {
        case "SELF_DEACTIVATION":
          return res.status(400).json({
            success: false,
            message: "You cannot deactivate your own account.",
          });

        case "ALREADY_INACTIVE":
          return res.status(400).json({
            success: false,
            message: "User is already inactive.",
          });

        case "LAST_ADMINISTRATOR":
          return res.status(400).json({
            success: false,
            message: "The last active Administrator cannot be deactivated.",
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

    await auditLog.create({
      userId: req.user.id,
      action: "USER_DEACTIVATED",
      entityName: "users",
      entityId: id,
      oldData: {
        isActive: foundUser.is_active,
      },
      newData: {
        isActive: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully.",
      data: result.user,
    });
  } catch (error) {
    console.error("[User] deactivateUser error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role_name !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only a Super Admin can activate users.",
      });
    }

    const foundUser = await user.findById(id);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (foundUser.is_active) {
      return res.status(400).json({
        success: false,
        message: "User is already active.",
      });
    }

    const activatedUser = await user.activate(id);

    await auditLog.create({
      userId: req.user.id,
      action: "USER_ACTIVATED",
      entityName: "users",
      entityId: id,
      oldData: { isActive: false },
      newData: { isActive: true },
    });

    return res.status(200).json({
      success: true,
      message: "User activated successfully.",
      data: activatedUser,
    });
  } catch (error) {
    console.error("[User] activateUser error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const deleteUser = async (req, res) => {
  /*
   * Hard deletion remains disabled.
   */
  return res.status(405).json({
    success: false,
    message: "User deletion is disabled. Deactivate the user instead.",
  });
};


module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  transferOwnership,
  changePassword,
  activateUser,
  deactivateUser,
  deleteUser,
};
