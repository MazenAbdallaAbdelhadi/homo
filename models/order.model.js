const mongoose = require("mongoose");
const paymentMethods = require("../config/payment-methods");
const { enumFormObject } = require("../utils/helper/enum-from-object");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking:{
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    totalOrderPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: Number,
      enum: enumFormObject(paymentMethods),
      default: paymentMethods["COD"],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    payedAt: Date,
  },
  {
    timestamps: true,
  }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name profileImg email",
  }).populate({
    path: "booking",
  });

  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
