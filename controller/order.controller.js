const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { recordNotFound, badRequest } = require("../utils/response/errors");
const User = require("../models/user.model");
const Order = require("../models/order.model");
// const Service = require("../models/service.model");
const { getAll, getOne } = require("../services/factory-handler");
const paymentMethods = require("../config/payment-methods");

/**
 * @desc make a COD payment request
 * @route POST v1/order/cash/:bookingId
 * @access private
 */
exports.createCashOrder = asyncHandler(async (req, res) => {
  // const taxPrice = 0;
  // const shippingPrice = 0;

  //  1- get cart depend on cartId


  // 2- Get order price depend on cart price "Check if coupon apply"
  // const cartPrice = cart.totalPriceAfterDiscount
  //   ? cart.totalPriceAfterDiscount
  //   : cart.totalCartPrice;

  // const totalOrderPrice = cartPrice + taxPrice + shippingPrice;
  const totalOrderPrice = 200 * 100;

  // 3- Create order with default paymentMethodType cash
  const order = await Order.create({
    user: req.user._id,
    totalOrderPrice,
  });

  // 4- After creating order, decrement product quantity, increment product sold
  // if (order) {
  //   const bulkOption = cart.cartItems.map((item) => ({
  //     updateOne: {
  //       filter: { _id: item.product },
  //       update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
  //     },
  //   }));
  //   await Product.bulkWrite(bulkOption, {});

  //   // 5- Clear cart depend on cartId
  //   await Cart.findByIdAndDelete(req.params.cartId);
  // }

  res.success({ data: order });
});

/**
 * @desc Update order paid status
 * @route POST v1/order/:id/paid
 * @access private [admin]
 */
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(
      recordNotFound({
        message: `There is no such a order with this id:${req.params.id}`,
      })
    );
  }

  // update order to paid
  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();

  res.success({ message: "order paid successfully", data: updatedOrder });
});

/**
 * @desc make a card payment request for mobile app
 * @route POST v1/order/payment-sheet/:cartId
 * @access private
 */
exports.paymentSheet = asyncHandler(async (req, res) => {
  // const taxPrice = 0;
  // const shippingPrice = 0;

  // 1- get cart by id
  // const cart = await Cart.findById(req.params.id);

  // if (!cart)
  //   return next(
  //     recordNotFound({ message: `Cart with id ${req.params.id} not found` })
  //   );

  // 2- get order price
  // const cartPrice = cart.totalPriceAfterDiscount
  //   ? cart.totalPriceAfterDiscount
  //   : cart.totalCartPrice;

  // 1.00EGP -> 100 pennies
  // const totalOrderPrice = (cartPrice + taxPrice + shippingPrice) * 100;
  const totalOrderPrice = 200 * 100;

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
    metadata: { shippingAddress: req.body, cartId: req.params.cartId },
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

const createCardOrder = async (intent) => {
  // const cartId = intent.metadata.cartId;
  const shippingAddress = intent.metadata.shippingAddress;
  const orderPrice = intent.amount_received;

  // const cart = await Cart.findById(cartId);
  const user = await User.findOne({ email: intent.receipt_email });

    await Order.create({
    user: user._id,
    // cartItems: cart.cartItems,
    shippingAddress,
    totalOrderPrice: orderPrice,
    isPaid: true,
    paidAt: Date.now,
    paymentMethod: paymentMethods.CreditCard,
  });

  // 4- After creating order, decrement product quantity, increment product sold
  // if (order) {
  //   const bulkOption = cart.cartItems.map((item) => ({
  //     updateOne: {
  //       filter: { _id: item.product },
  //       update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
  //     },
  //   }));
  //   await Product.bulkWrite(bulkOption, {});

  //   // 5- Clear cart depend on cartId
  //   await Cart.findByIdAndDelete(cartId);
  // }
};

exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === "user") req.query.user = { user: req.user._id };
  next();
});

/**
 * @desc Get all orders
 * @route GET v1/order
 * @access private [Admin]
 */
exports.getOrders = getAll(Order);

/**
 * @desc Get order by id
 * @route GET v1/order/:id
 * @access private [Admin]
 */
exports.getOrder = getOne(Order);

// TODO: add paid amount to Store balance and deduct admin commitions
/**
 * @desc Update order delivered status
 * @route POST v1/order/:id/delivered
 * @access private [admin]
 */
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(
      recordNotFound({
        message: `There is no such a order with this id:${req.params.id}`,
      })
    );
  }

  // update order to paid
  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  // TODO:
  // add paid amount to each store balance form order cartItems
  // i already populate store in the model so i can access it
  // order.cartItems[index].product.store -> storeId
  // order.cartItems[index].product.price -> price
  // get store by id and set price to store balance and deducte admin fees
  // addBalanceToStore(order.cartItems);

  res.success({ message: "order delivered successfully", data: updatedOrder });
});

// TODO: filter orders for store
// how? should i send all the user cartItems? or should i filter products for each store?
// if i filter products for each store then what about total order price?
// add balance to each store
// const addBalanceToStore = async (cartItems) => {
//   // 1- get all stores
//   const storesIds = cartItems.map((item) => item.product.store);
//   console.log(storesIds);
//   const stores = await Store.find({ _id: { $in: storesIds } });

//   // 2- updated each store based on cart items
//   stores.forEach((store) => {
//     const adminCommission = store.commissionRate;
//     const storeItems = cartItems.filter(
//       (item) => item.product.store.toString() === store._id.toString()
//     );
//     // calc store total revnue
//     // wait!!! what if coupon is applied to cart then how to calc revnue???
//     // there is diffrenet type of discounts
//     // percentage some with limitions like maximum discount 2% with maximum discount -200 pounds
//     // fixed discount like -100 pounds
//     // cartItems = [{product, price, quantity}]
//     const totalRevnue = storeItems.reduce(
//       (acc, item) => acc + item.price * item.quantity,
//       0
//     );
//   });
// };
