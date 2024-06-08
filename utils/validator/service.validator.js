const { body, param, checkExact } = require("express-validator");
const Service = require("../../models/service.model");
const Category = require("../../models/category.model");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const { recordNotFound, unAuthorized } = require("../response/errors");
const roles = require("../../config/roles");

exports.createServiceValidator = [
  body("title")
    .notEmpty()
    .withMessage("Service name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Service name must be between 3 and 50 characters"),
  body("description")
    .notEmpty()
    .withMessage("Service description is required")
    .isLength({ min: 25 })
    .withMessage("Service description must be at least 25 characters"),
  body("coverImage").notEmpty().withMessage("Service cover image is required"),
  body("images").optional().isArray({ max: 5 }),
  body("category")
    .notEmpty()
    .withMessage("Category id is required")
    .isMongoId()
    .withMessage("invalid Category id")
    .custom(async (val) => {
      const categoryExists = await Category.findById(val);
      if (!categoryExists) return Promise.reject("Category does not exist");
      return true;
    }),
  body("location").notEmpty().withMessage("location is required"),
  body("isActive")
    .optional()
    .custom((val, { req }) => {
      req.body.isActive = val.toLowerCase() === "true";
      return true;
    }),
  checkExact(),
  validatorMiddleware,
  // set current user as provider
  (req, res, next) => {
    req.body.provider = req.user._id;
    next();
  },
];

exports.getServiceValidator = [
  param("id").isMongoId().withMessage("invalid Service id"),
  checkExact(),
  validatorMiddleware,
];

exports.updateServiceValidator = [
  param("id").isMongoId().withMessage("invalid Service id"),
  body("title")
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage("Service name must be between 3 and 50 characters"),
  body("description")
    .optional()
    .isLength({ min: 25 })
    .withMessage("Service description must be at least 25 characters"),
  body("coverImage").optional(),
  body("images").optional().isArray({ max: 5 }),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("invalid Category id")
    .custom(async (val) => {
      const categoryExists = await Category.findById(val);
      if (!categoryExists) return Promise.reject("Category does not exist");
      return true;
    }),
  body("location").optional(),
  body("isActive")
    .optional()
    .custom((val, { req }) => {
      req.body.isActive = req.body.isActive = val.toLowerCase() === "true";
      return true;
    }),
  checkExact(),
  validatorMiddleware,
  // check if user is the owner of the service
  async (req, _res, next) => {
    const service = await Service.findById(req.params.id);

    if (!service) return next(recordNotFound({ message: "Service not found" }));

    if (service.provider._id.toString() !== req.user._id.toString())
      return next(
        unAuthorized({
          message: "you are not allowed to update this Service",
        })
      );

    return next();
  },
];

exports.deleteServiceValidator = [
  param("id").isMongoId().withMessage("invalid Service id"),
  checkExact(),
  validatorMiddleware,
  // check if the user is admin or owner of the service
  async (req, _res, next) => {
    if (req.user.role === roles.ADMIN) {
      return next();
    }

    if (req.user.role === roles.PROVIDER) {
      const service = await Service.findById(req.params.id);
      if (!service)
        return next(recordNotFound({ message: "Service not found" }));

      if (service.provider._id.toString() !== req.user._id.toString())
        return next(
          unAuthorized({
            message: "you are not allowed to delete this Service",
          })
        );
    }

    next();
  },
];
