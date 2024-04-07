// const { Router } = require("express");
// const {
//   paymentSheet,
//   createCashOrder,
//   filterOrderForLoggedUser,
//   getOrder,
//   getOrders,
//   updateOrderToPaid,
// } = require("../controller/order.controller");
// const { protect, allowedRoles } = require("../services/auth");
// const roles = require("../config/roles");

// const router = Router();

// router.use(protect);
// router.get("/", filterOrderForLoggedUser, getOrders);
// router.get("/:id", getOrder);

// // router.post("/payment-sheet/:cartId", paymentSheet);
// // router.post("/cash/:cartId", createCashOrder);

// // PAY ON DELIVERY
// // ONLY PROVIDER CAN UPDATE IT TO PAYED
// router.post("/:id/paid", updateOrderToPaid);


// module.exports = router;
