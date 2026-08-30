const { category } = require("../models");

const getAllCategories = async (req, res) => {
  try {
    const categories =
      await category.findAll();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error(
      "[Category] getAllCategories:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = {
  getAllCategories,
};