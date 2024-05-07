const asyncHandler = require("express-async-handler");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const { getOne, paginate } = require("../services/factory-handler");
const { recordNotFound, badRequest } = require("../utils/response/errors");
const { firebase } = require("../config/firebase");
const {
  BOOKING_ACCEPTED,
  BOOKING_REJECTED,
  BOOKING_SENT,
  BOOKING_CANCELED,
  BOOKING_COMPLETED,
} = require("../config/notification/notification-types");
const notificationCategories = require("../config/notification/notification-categories");

/**
 * @desc get all bookings
 * @route GET v1/booking/:id
 * @access protected [owner | provider | admin]
 */
exports.getBooking = getOne(Booking);

/**
 * @desc get all bookings
 * @route GET v1/booking
 * @access private [admin]
 */
exports.getBookings = paginate(Booking, []);

/**
 * @desc get logged user bookings
 * @route GET v1/booking/myBooking
 * @access protected [user]
 */
exports.getLoggedUserBookings = asyncHandler(async (req, res, next) => {
  req.query.user = req.user._id;
  next();
});

/**
 * @desc get provider bookings
 * @route GET v1/booking/providerBooking
 * @access protected [provider]
 */
exports.getProviderBookings = asyncHandler(async (req, res, next) => {
  req.query.provider = req.user._id;
  next();
});

/**
 * @desc create a booking request
 * @route POST v1/booking/booking-request
 * @access protected [user]
 */
exports.bookingRequest = asyncHandler(async (req, res, next) => {
  const { serviceId, startDate, endDate, address, price, description } =
    req.body;

  const service = await Service.findById(serviceId);
  if (!service) return next(recordNotFound({ message: "Service not found" }));
  const provider = service.provider;

  // Check for existing, non-canceled/rejected bookings for the provider during the requested timeframe
  const existingBookings = await Booking.find({
    provider,
    startDate: { $lt: endDate }, // Bookings that start before the requested end date
    endDate: { $gt: startDate }, // Bookings that end after the requested start date
    $nor: [{ status: "canceled" }, { status: "rejected" }], // Exclude canceled or rejected bookings
  });

  if (existingBookings.length > 0) {
    return next(
      badRequest({ message: "Provider already has a booking during this time" })
    );
  }

  //   TODO: check if there is a coupon and apply the coupon
  let priceAfterDiscount = undefined;

  const bookingRequeset = await Booking.create({
    provider,
    user: req.user._id,
    startDate,
    endDate,
    address,
    description,
    price,
    priceAfterDiscount,
  });

  // send notification to provider
  let message = {
    token: service.provider.FCMToken,
    notification: notificationCategories[BOOKING_SENT](service.provider.name),
  };

  await firebase.messaging().send(message);

  res.success({
    message: "Booking created successfully",
    data: bookingRequeset,
  });
});

/**
 * @desc booking response
 * @route POST v1/booking/booking-response/:id
 * @access protected [provider]
 */
exports.bookingResponse = asyncHandler(async (req, res, next) => {
  const { response, rejectReason } = req.body;
  const { id } = req.params;

  const booking = await Booking.findOne({ _id: id, provider: req.user._id });

  if (!booking) return next(recordNotFound({ message: "booking not found" }));

  booking.status = response;
  booking.rejectReason = rejectReason;

  await booking.save();

  // send notification to user with  booking response
  let message = {
    token: booking.user.FCMToken,
    notification: notificationCategories[
      response === "accepted" ? BOOKING_ACCEPTED : BOOKING_REJECTED
    ](booking.provider.name),
  };

  await firebase.messaging().send(message);

  //   TODO: deduct the commision if he accepts

  res.success();
});

/**
 * @desc cancele booking request
 * @route PUT v1/booking/cancle-booking/:id
 * @access protected [user | provider]
 */
exports.bookingCancle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const booking = await Booking.findOneAndUpdate(
    { _id: id, status: "accepted" },
    {
      status: "canceled",
      cancleReason: req.body?.cancleReason,
    }
  );

  if (!booking) return next(recordNotFound({ message: "Booking not found" }));

  let token;
  let name;

  if (req.user._id.toString() === booking.user._id.toString()) {
    token = booking.provider.FCMToken;
    name = booking.provider.name;
  } else {
    token = booking.user.FCMToken;
    name = booking.user.name;
  }

  // send notification to user and provider with new booking status
  let message = {
    token,
    notification: notificationCategories[BOOKING_CANCELED](name),
  };

  await firebase.messaging().send(message);

  //   TODO:   if user cancle and is paid revenue the user with 80% of total price
  //   TODO:   if provider cancle and is paid revenue the user with 100% of total price
  res.success({ message: "Booking canceled successfully" });
});

/**
 * @desc complete booking request
 * @route PUT v1/booking/complete-booking/:id
 * @access protected [user]
 */
exports.bookingComplete = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const booking = await Booking.findOne({ _id: id, status: "accepted" });

  if (!booking) return next(recordNotFound({ message: "Booking not found" }));

  if (!booking.isPaid)
    return next(
      badRequest({ message: "Booking must be paid to perform this action" })
    );

  booking.status = "completed";
  await booking.save();

  // send notification to user and provider with new booking status
  let message = {
    token:booking.provider.FCMToken,
    notification: notificationCategories[BOOKING_COMPLETED](booking.provider.name),
  };

  await firebase.messaging().send(message);

  // TODO:  set total price in provider balance

  res.success({ message: "Booking completed successfully" });
});
