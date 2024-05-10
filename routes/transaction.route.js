const { Router } = require("express");
const {
  createCashOrder,
  filterOrderForLoggedUser,
  getOrders,
  paymentSheet,
} = require("../controller/transaction.controller");
const { protect, allowedRoles } = require("../services/auth");
const roles = require("../config/roles");

const router = Router();

router.use(protect);

// get all user transactions
router.get("/", filterOrderForLoggedUser, getOrders);

router.post(
  "/booking/cash/:bookingId",
  allowedRoles(roles.PROVIDER),
  createCashOrder
);

router.post(
  "/payment-sheet/:bookingId",
  allowedRoles(roles.CUSTOMER),
  paymentSheet
);

module.exports = router;