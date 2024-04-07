const { Router } = require("express");
const {
  bookingCancle,
  bookingComplete,
  bookingRequest,
  bookingResponse,
  getBooking,
  getBookings,
  getLoggedUserBookings,
  getProviderBookings,
} = require("../controller/booking.controller");
const {
  getBookingValidator,
  bookingRequestValidator,
  bookingResponseValidator,
  bookingCompleteValidator,
  bookingCancleValidator,
} = require("../utils/validator/booking.validator");
const { protect, allowedRoles } = require("../services/auth");
const roles = require("../config/roles");

const router = Router();

router.use(protect);

router.get("/", allowedRoles(roles.ADMIN), getBookings);
router.get(
  "/myBooking",
  allowedRoles(roles.CUSTOMER),
  getLoggedUserBookings,
  getBookings
);
router.get("/providerBooking", getProviderBookings, getBookings);
router.get("/:id", getBookingValidator, getBooking);

router.post(
  "/booking-request",
  allowedRoles(roles.CUSTOMER),
  bookingRequestValidator,
  bookingRequest
);

router.post(
  "/booking-response/:id",
  allowedRoles(roles.PROVIDER),
  bookingResponseValidator,
  bookingResponse
);

router.put(
  "/cancle-booking/:id",
  allowedRoles(roles.PROVIDER, roles.CUSTOMER),
  bookingCancleValidator,
  bookingCancle
);

router.put(
  "/complete-booking/:id",
  allowedRoles(roles.PROVIDER, roles.CUSTOMER),
  bookingCompleteValidator,
  bookingComplete
);

module.exports = router;
