const { Router } = require("express");

const router = Router();

router.use("/api/v1/users", require("./user.route")); // DONE
router.use("/api/v1/auth", require("./auth.route")); // DONE
router.use("/api/v1/categories", require("./category.route")); // DONE
router.use("/api/v1/service", require("./service.route")); // DONE
router.use("/api/v1/review", require("./review.route")); // DONE
router.use("/api/v1/wishlist", require("./wishlist.route")); // DONE
router.use("/api/v1/address", require("./address.route")); // DONE
router.use("/api/v1/coupon", require("./coupon.route")); // DONE
router.use("/api/v1/booking", require("./booking.route")); // DONE
// TODO: these routes
// router.use("/api/v1/payment", require("./payment.route")); // IN PROCESS
// router.use("/api/v1/payout", require("./payout.route"));

module.exports = router;
