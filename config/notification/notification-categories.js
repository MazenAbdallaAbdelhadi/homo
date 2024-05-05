const {
  BOOKING_ACCEPTED,
  BOOKING_REJECTED,
  BOOKING_SENT,
  BOOKING_CANCELED,
  BOOKING_COMPLETED,
} = require("./notification-types");

const sentABookingRequest = "أرسل طلب حجز";
const acceptBookingRequest = "وافق على طلب الحجز";
const rejectBookingRequest = "رفض طلب الحجز";
const canceledBooking = "الغي الحجز";
const bookingCompleted = "تم اكمال الحجز مع";

module.exports = {
  [BOOKING_SENT]: (name) => {
    return {
      title: "تم ارسال طلب حجز",
      body: `${name} ${sentABookingRequest}`,
    };
  },
  [BOOKING_ACCEPTED]: (name) => {
    return {
      title: "تمت الموافقة على طلب الحجز",
      body: `${name} ${acceptBookingRequest}`,
    };
  },
  [BOOKING_REJECTED]: (name) => {
    return {
      title: "تم رفض طلب الحجز",
      body: `${name} ${rejectBookingRequest}`,
    };
  },

  [BOOKING_CANCELED]: (name) => {
    return {
      title: "تم الغاء الحجز",
      body: `${name} ${canceledBooking}`,
    };
  },
  [BOOKING_COMPLETED]: (name) => {
    return {
      title: "تم اكامل الحجز",
      body: `${bookingCompleted} ${name}`,
    };
  },
};
