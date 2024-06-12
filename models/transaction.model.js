const mongoose = require("mongoose");
const paymentMethods = require("../config/payment-methods");
const transactionType = require("../config/transaction-types");
const { enumFormObject } = require("../utils/helper/enum-from-object");

const transactionSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: ["USER", "SYSTEM"],
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    transactionType: {
      type: String,
      enum: enumFormObject(transactionType),
      required: true,
    },
    paymentMethod: {
      type: Number,
      enum: enumFormObject(paymentMethods),
      default: paymentMethods["COD"],
    },
    date: Date,
  },
  {
    timestamps: true,
  }
);

transactionSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name profileImage email",
  });

  next();
});

const Order = mongoose.model("Transaction", transactionSchema);
module.exports = Order;
