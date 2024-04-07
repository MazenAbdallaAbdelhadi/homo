const { body, param, checkExact } = require("express-validator");
const Category = require("../../models/category.model");
const validatorMiddleware = require("../../middleware/validatorMiddleware");

exports.createCategoryValidator = [
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 3, max: 125 })
    .withMessage("name must be between 3 and 125 characters")
    .trim()
    .custom(async (val) => {
      const categoryExists = await Category.findOne({ name: val });
      if (categoryExists) return Promise.reject("Category already exists");
      return true;
    }),
  body("image").notEmpty().withMessage("image is required"),
  checkExact(),
  validatorMiddleware,
];

exports.getCategoryValidator = [
  param("id").isMongoId().withMessage("invalid id"),
  validatorMiddleware,
];

exports.updateCategoryValidator = [
  param("id").isMongoId().withMessage("invalid id"),
  body("name")
    .optional()
    .isLength({ min: 3, max: 125 })
    .withMessage("name must be between 3 and 125 characters")
    .trim()
    .custom(async (val) => {
      const categoryExists = await Category.findOne({ name: val });
      if (categoryExists) return Promise.reject("Category already exists");
      return true;
    }),
  body("image").optional(),
  checkExact(),
  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  param("id").isMongoId().withMessage("invalid id"),
  validatorMiddleware,
];
