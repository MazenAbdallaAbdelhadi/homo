const { Router } = require("express");
const {
  createCashOrder,
  filterOrderForLoggedUser,
  getOrders,
  paymentSheet,
  paymentFine,
  payCommitionsCash,
  getStates,
} = require("../controller/transaction.controller");
const { protect, allowedRoles } = require("../services/auth");
const roles = require("../config/roles");

const router = Router();

router.use(protect);

router.get("/all-trasactions", allowedRoles(roles.ADMIN), getOrders);

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

router.post("/payment-fine", allowedRoles(roles.PROVIDER), paymentFine);
router.post("/pay-commition", allowedRoles(roles.ADMIN), payCommitionsCash);
router.get("/get-states", allowedRoles(roles.ADMIN), getStates);

module.exports = router;
