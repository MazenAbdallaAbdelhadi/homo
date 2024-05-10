const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    address: {
      details: String,
      phone: String,
      city: String,
      postalCode: String,
    },
    description: String,
    price: Number,
    priceAfterDiscount: Number,
    status: {
      type: String,
      enum: ["pending", "rejected", "accepted", "completed", "canceled"],
      default: "pending",
    },
    rejectReason: String,
    cancleReason: String,
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

bookingSchema.pre(/^find/, function (next) {
  this.populate("user");
  this.populate("provider");
  this.populate({ path: "service", path: "name" });
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
