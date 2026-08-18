const { department } = require("../models");

const getAllDepartments = async (req, res) => {
  try {
    const includeInactive =
      req.query.includeInactive === "true";

    const departments = await department.findAll({
      includeInactive,
    });

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error(
      "[Department] getAllDepartments error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve departments.",
    });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const foundDepartment =
      await department.findById(req.params.id);

    if (!foundDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: foundDepartment,
    });
  } catch (error) {
    console.error(
      "[Department] getDepartmentById error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department.",
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const cleanName = String(
      req.body.name || "",
    ).trim();

    const cleanDescription =
      req.body.description
        ? String(req.body.description).trim()
        : null;

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required.",
      });
    }

    if (cleanName.length > 150) {
      return res.status(400).json({
        success: false,
        message:
          "Department name must not exceed 150 characters.",
      });
    }

    const existingDepartment =
      await department.findByName(cleanName);

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message:
          "A department with this name already exists.",
      });
    }

    const createdDepartment =
      await department.create({
        name: cleanName,
        description: cleanDescription,
      });

    return res.status(201).json({
      success: true,
      message: "Department created successfully.",
      data: createdDepartment,
    });
  } catch (error) {
    console.error(
      "[Department] createDepartment error:",
      error.message,
    );

    /*
     * PostgreSQL unique constraint protection.
     * This remains necessary even though we check first,
     * because two requests can pass the check concurrently.
     */
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "A department with this name already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create department.",
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    const cleanName = String(
      req.body.name || "",
    ).trim();

    const cleanDescription =
      req.body.description
        ? String(req.body.description).trim()
        : null;

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required.",
      });
    }

    if (cleanName.length > 150) {
      return res.status(400).json({
        success: false,
        message:
          "Department name must not exceed 150 characters.",
      });
    }

    const existingDepartment =
      await department.findById(departmentId);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const departmentWithSameName =
      await department.findByName(cleanName);

    if (
      departmentWithSameName &&
      departmentWithSameName.id !== departmentId
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Another department already uses this name.",
      });
    }

    const updatedDepartment =
      await department.update(
        departmentId,
        {
          name: cleanName,
          description: cleanDescription,
        },
      );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      data: updatedDepartment,
    });
  } catch (error) {
    console.error(
      "[Department] updateDepartment error:",
      error.message,
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Another department already uses this name.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update department.",
    });
  }
};

const deactivateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    const existingDepartment =
      await department.findById(departmentId);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    if (!existingDepartment.is_active) {
      return res.status(400).json({
        success: false,
        message: "Department is already inactive.",
      });
    }

    const deactivatedDepartment =
      await department.deactivate(departmentId);

    return res.status(200).json({
      success: true,
      message:
        "Department deactivated successfully.",
      data: deactivatedDepartment,
    });
  } catch (error) {
    console.error(
      "[Department] deactivateDepartment error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate department.",
    });
  }
};

const activateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    const existingDepartment =
      await department.findById(departmentId);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    if (existingDepartment.is_active) {
      return res.status(400).json({
        success: false,
        message: "Department is already active.",
      });
    }

    const activatedDepartment =
      await department.activate(departmentId);

    return res.status(200).json({
      success: true,
      message:
        "Department activated successfully.",
      data: activatedDepartment,
    });
  } catch (error) {
    console.error(
      "[Department] activateDepartment error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to activate department.",
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  activateDepartment,
};