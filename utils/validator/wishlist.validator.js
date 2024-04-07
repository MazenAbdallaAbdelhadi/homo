const { body, checkExact } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const Product = require("../../models/service.model");

exports.addProductToWishlistValidator = [
  body("serviceId")
    .isMongoId()
    .withMessage("invalid service id")
    .custom(async (val) => {
      const productExists = await Product.findById(val);
      if (!productExists) return Promise.reject("service does not exist");
      return true;
    }),
  checkExact(),
  validatorMiddleware,
];

exports.removeProductFromWishlistValidator = [
  body("serviceId").isMongoId().withMessage("invalid service id"),
  checkExact(),
  validatorMiddleware,
];
