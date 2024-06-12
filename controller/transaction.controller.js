const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const {
  recordNotFound,
  badRequest,
  unAuthorized,
  validationError,
} = require("../utils/response/errors");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Booking = require("../models/booking.model");

const { getAll } = require("../services/factory-handler");
const paymentMethods = require("../config/payment-methods");
const transactionType = require("../config/transaction-types");
const roles = require("../config/roles");
const { isValidObjectId } = require("mongoose");

// -> user pay booking -> done
// -> [user, provider] pay fine -> done
// --------------------------------------
// <- SYSTEM pay provider  -> done
// <- SYSTEM pay revenue to user

// 1- cash
// 2- card

/**
 * @desc make a COD payment request
 * @route POST v1/transaction/booking/cash/:bookingId
 * @access private [provider]
 */
exports.createCashOrder = asyncHandler(async (req, res) => {
  // 1- get bookins by id
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(recordNotFound({ message: "Booking not found" }));
  }

  // check if provider is the provider in the booking
  if (booking.provider._id.toString() !== req.user._id.toString()) {
    return next(unAuthorized({ message: "access denied" }));
  }

  // 2- get booking price
  const bookingPrice = booking.price;

  // 3- create transaction order
  await Transaction.create({
    from: "USER",
    user: booking.user._id,
    transactionType: transactionType.PAY_BOOKING,
    paymentMethod: paymentMethods.COD,
    amount: bookingPrice,
    date: Date.now(),
  });

  // 4- update booking to payed
  booking.isPaid = true;
  await booking.save();

  // 5- deduct transaction admin fees amount from provider
  const user = await User.findById(req.user._id);

  const adminFees = bookingPrice * user.providerAccount.commissionRate;
  user.providerAccount.balance -= adminFees;

  await user.save();

  await Transaction.create({
    from: "SYSTEM",
    user: req.user._id,
    transactionType: transactionType.PAY_WORKER,
    paymentMethod: paymentMethods.COD,
    amount: bookingPrice - adminFees,
    date: Date.now(),
  });

  res.success({ message: "booking payed successfully" });
});

/**
 * @desc make a card payment request for mobile app
 * @route POST v1/transaction/payment-sheet/:bookingId
 * @access private [user]
 */
exports.paymentSheet = asyncHandler(async (req, res, next) => {
  // 1- get bookins by id
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(recordNotFound({ message: "Booking not found" }));
  }

  // check if the user is the user who made booking request
  if (booking.user._id.toString() === req.user._id.toString()) {
    return next(unAuthorized({ message: "access denied" }));
  }

  // 2- get booking price
  const bookingPrice = booking.price;

  // 1.00EGP -> 100 pennies
  const totalOrderPrice = bookingPrice * 100;
  // const totalOrderPrice = 200 * 100;

  // create payment intent
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2022-11-15" }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalOrderPrice,
    currency: "egp",
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: req.user.email,
    metadata: { bookingId: booking._id },
  });

  res.success({
    data: {
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUPLIC,
    },
  });
});

/**
 * @desc make a card payment request for mobile app
 * @route POST v1/transaction/payment-fine
 * @access private [user | provider]
 */
exports.paymentFine = asyncHandler(async (req, res, next) => {
  // 1.00EGP -> 100 pennies
  const totalOrderPrice = req.body.amount;
  // const totalOrderPrice = 200 * 100;

  // create payment intent
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2022-11-15" }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalOrderPrice,
    currency: "egp",
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: req.user.email,
    metadata: { userId: req.user._id },
  });

  res.success({
    data: {
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUPLIC,
    },
  });
});

/**
 * @desc make a payment request for mobile app
 * @route POST v1/order/payment-webhook
 * @access public
 */
exports.paymentWebHook = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return next(badRequest({ data: err }));
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("EVENT DATA OBJECT", event.data.object);
      createCardOrder(event.data.object);
      break;
  }

  res.status(200).json({ recived: true });
});

// handle pay booking or pay fine
const createCardOrder = async (intent) => {
  const amount = intent.amount_received;
  const userId = intent.metadata.userId;
  const bookingId = intent.metadata.bookingId;

  // check if there is a bookingId
  if (bookingId) {
    // 1- get booking
    const booking = await Booking.findById(req.params.bookingId);

    // 2- create transaction order
    await Transaction.create({
      from: "USER",
      user: booking.user._id,
      transactionType: transactionType.PAY_BOOKING,
      paymentMethod: paymentMethods.CreditCard,
      amount: amount,
      date: Date.now(),
    });

    // 3- update booking to payed
    booking.isPaid = true;
    await booking.save();

    // 4- deduct transaction admin fees amount from provider
    const user = await User.findById(booking.provider._id);

    const providerFees =
      bookingPrice - bookingPrice * user.providerAccount.commissionRate;
    user.providerAccount.balance += providerFees;
    await user.save();

    await Transaction.create({
      from: "SYSTEM",
      user: booking.provider._id,
      transactionType: transactionType.PAY_WORKER,
      paymentMethod: paymentMethods.CreditCard,
      amount: providerFees,
      date: Date.now(),
    });

    return;
  }

  // if no booking id then pay fees
  if (userId) {
    // 1- create transaction order
    await Transaction.create({
      from: "USER",
      user: userId,
      transactionType: transactionType.PAY_FINE,
      paymentMethod: paymentMethods.CreditCard,
      amount: amount,
      date: Date.now(),
    });

    // 2- add paid amount to user account
    const user = await User.findById(userId);
    user.providerAccount.balance += amount;
    await user.save();
  }
};

exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === roles.CUSTOMER || req.user.role === roles.PROVIDER)
    req.query.user = { user: req.user._id };

  next();
});

/**
 * @desc Get all orders
 * @route GET v1/order
 * @access private [Admin]
 */
exports.getOrders = getAll(Transaction);

/**
 * @desc pay admin commition in cash
 * @route GET v1/pay-commition
 * @access private [Admin]
 */
exports.payCommitionsCash = asyncHandler(async (req, res, next) => {
  const { userId, amount } = req.body;

  if (!userId || !isValidObjectId(userId) || !amount)
    return next(
      validationError({ message: "invalide data", data: { userId, amount } })
    );

  // 1- create transaction order
  await Transaction.create({
    from: "USER",
    user: userId,
    transactionType: transactionType.PAY_FINE,
    paymentMethod: paymentMethods.COD,
    amount: amount,
    date: Date.now(),
  });

  // 2- add paid amount to user account
  const user = await User.findById(userId);
  user.providerAccount.balance += Number(amount);
  await user.save();

  res.success({ message: "PAYED" });
});

async function calculateTransactionAmounts() {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          transactionType: {
            $in: ["PAY_BOOKING", "PAY_FINE", "PAY_WORKER"],
          },
        },
      },
      {
        $group: {
          _id: "$transactionType",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const amounts = {
      PAY_BOOKING: 0,
      PAY_FINE: 0,
      PAY_WORKER: 0,
    };

    result.forEach((item) => {
      amounts[item._id] = item.totalAmount;
    });

    return amounts;
  } catch (error) {
    console.error("Error aggregating transaction amounts:", error);
    throw error;
  }
}

exports.getStates = asyncHandler(async (req, res) => {
  const amounts = await calculateTransactionAmounts();

  res.success({ data: amounts });
});
