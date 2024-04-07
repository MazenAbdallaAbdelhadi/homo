const { body, param, checkExact } = require("express-validator");
const Booking = require("../../models/booking.model");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const roles = require("../../config/roles");
const { recordNotFound, unAuthorized } = require("../response/errors");

exports.getBookingValidator = [
  param("id").isMongoId().withMessage("invalid id"),
  validatorMiddleware,
  async (req, res, next) => {
    if (req.user.role === roles.ADMIN) return next();

    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(recordNotFound({ message: "booking not found" }));

    if (
      req.user._id.toString() !== booking.user ||
      req.user._id.toString() !== booking.provider
    )
      return next(
        unAuthorized({
          message: "your are not authorized to perform this action",
        })
      );

    return next();
  },
];

exports.bookingRequestValidator = [
  body("serviceId")
    .notEmpty()
    .withMessage("service id is required")
    .isMongoId()
    .withMessage("invalid service id"),
  body("startDate").isISO8601().withMessage("invalid start date"),
  body("endDate")
    .isISO8601()
    .withMessage("invalid end date")
    .custom((val, { req }) => {
      if (val && req.body.startDate && val < req.body.startDate) {
        throw new Error("End date cannot be earlier than start date");
      }
      return true;
    }),
  body("price")
    .notEmpty()
    .withMessage("price is required")
    .custom((val) => Number(val) >= 50)
    .withMessage("price cannot be less than 50"),
  body("description").notEmpty().withMessage("description is required"),
  body("address.details").notEmpty().withMessage("address details is required"),
  body("address.city").notEmpty().withMessage("address city is required"),
  body("address.postalCode")
    .notEmpty()
    .withMessage("address postal code is required")
    .isPostalCode("any")
    .withMessage("invalid postal code"),
  body("address.phone")
    .notEmpty()
    .withMessage("address phone is required")
    .isMobilePhone()
    .withMessage("phone number must be egyptian"),
  validatorMiddleware,
];

exports.bookingResponseValidator = [
  param("id").isMongoId().withMessage("invalid booking id"),
  body("response")
    .isIn(["accepted", "rejected"])
    .withMessage("invalid response"),
  body("rejectReason").custom((val, { req }) => {
    if (req.body.response === "rejected" && !val)
      throw new Error("reject reason is required");
    else return true;
  }),
  checkExact(),
  validatorMiddleware,
  // only provider of booking request can response
  async (req, _res, next) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking)
        return next(recordNotFound({ message: "booking not found" }));

      if (booking.provider._id.toString() !== req.user._id.toString())
        return next(
          unAuthorized({
            message: "your are not allowed to perform this action",
          })
        );

      return next();
    } catch (err) {
      next(err);
    }
  },
];

exports.bookingCancleValidator = [
  param("id").isMongoId().withMessage("invalid booking id"),
  body("cancleReason").optional(),
  checkExact(),
  validatorMiddleware,
  // only customer or provider of booking request can response
  async (req, _res, next) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking)
        return next(recordNotFound({ message: "booking not found" }));

      if (
        booking.provider._id.toString() !== req.user._id.toString() &&
        booking.user._id.toString() !== req.user._id.toString()
      )
        return next(
          unAuthorized({
            message: "your are not allowed to perform this action",
          })
        );

      return next();
    } catch (err) {
      next(err);
    }
  },
];

exports.bookingCompleteValidator = [
  param("id").isMongoId().withMessage("invalid booking id"),
  checkExact(),
  validatorMiddleware,
  // only customer or provider of booking request can response
  async (req, _res, next) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking)
        return next(recordNotFound({ message: "booking not found" }));

      if (
        booking.provider._id.toString() !== req.user._id.toString() &&
        booking.user._id.toString() !== req.user._id.toString()
      )
        return next(
          unAuthorized({
            message: "your are not allowed to perform this action",
          })
        );

      return next();
    } catch (err) {
      next(err);
    }
  },
];
