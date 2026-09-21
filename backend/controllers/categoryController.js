const { category, auditLog } = require("../models");

const getAllCategories = async (req, res) => {
  try {
    const categories = await category.findAll();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("[Category] getAllCategories:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const CreateCategories = async (req, res) => {
  try {
    const cleanName = String(req.body.name || "").trim();
    const cleanDescription = req.body.description
      ? String(req.body.description).trim()
      : null;

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name must not exceed 100 characters.",
      });
    }

    const existingCategory = await category.findByName(cleanName);

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists.",
      });
    }

    const newCategory = await category.createCategory({
      name: cleanName,
      description: cleanDescription,
    });

    await auditLog.create({
      userId: req.user.id,
      action: "CATEGORY_CREATED",
      entityName: "categories",
      entityId: newCategory.id,
      newData: {
        name: newCategory.name,
        description: newCategory.description,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: newCategory,
    });
  } catch (error) {
    console.error("[Category] createCategories error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const categoryName = String(req.body.name || "").trim();
    const categoryDescription = req.body.description
      ? String(req.body.description).trim()
      : null;

    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    if (categoryName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name must not exceed 100 characters.",
      });
    }

    const existingCategory = await category.findById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const categoryWithSameName = await category.findByName(categoryName);

    if (categoryWithSameName && categoryWithSameName.id !== id) {
      return res.status(409).json({
        success: false,
        message: "Another category already uses this name.",
      });
    }

    const updatedCategory = await category.updateCategory(id, {
      name: categoryName,
      description: categoryDescription,
    });

    await auditLog.create({
      userId: req.user.id,
      action: "CATEGORY_UPDATED",
      entityName: "categories",
      entityId: updatedCategory.id,
      newData: {
        name: updatedCategory.name,
        description: updatedCategory.description,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("[Category] updateCategory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const deactivateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const existingCategory = await category.findById(categoryId);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    if (!existingCategory.is_active) {
      return res.status(400).json({
        success: false,
        message: "Category is already inactive.",
      });
    }

    const deactivatedCategory = await category.deactivateCategory(categoryId);

    await auditLog.create({
      userId: req.user.id,
      action: "CATEGORY_DEACTIVATED",
      entityName: "categories",
      entityId: deactivatedCategory.id,
      newData: {
        is_active: deactivatedCategory.is_active,
        updated_at: deactivatedCategory.updated_at,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully.",
      data: deactivatedCategory,
    });
  } catch (error) {
    console.error("[Category] deactivateCategory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate category.",
    });
  }
};

const activateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const existingCategory = await category.findById(categoryId);

    if (!existingCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    if (existingCategory.is_active) {
      return res
        .status(400)
        .json({ success: false, message: "category is already active." });
    }

    const activatedCategory = await category.activateCategory(categoryId);

    await auditLog.create({
      userId: req.user.id,
      action: "CATEGORY_ACTIVATED",
      entityName: "categories",
      entityId: activatedCategory.id,
      newData: {
        is_active: activatedCategory.is_active,
        updated_at: activatedCategory.updated_at,
      },
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Category activated successfully.",
        data: activatedCategory,
      });
  } catch (error) {
    console.error("[Category] activateCategory error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to activate category." });
  }
};

module.exports = {
  getAllCategories,
  CreateCategories,
  updateCategory,
  deactivateCategory,
  activateCategory,
};
