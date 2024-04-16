const { Router } = require("express");
const {
  createService,
  deleteService,
  getService,
  getServices,
  updateService,
  uploadServiceImages,
  resizeServiceImages,
  getMyService,
} = require("../controller/service.controller");
const {
  createServiceValidator,
  deleteServiceValidator,
  getServiceValidator,
  updateServiceValidator,
} = require("../utils/validator/service.validator");
const { protect, allowedRoles } = require("../services/auth");
const roles = require("../config/roles");

const router = Router();

router
  .route("/")
  .post(
    protect,
    allowedRoles(roles.PROVIDER),
    uploadServiceImages,
    resizeServiceImages,
    createServiceValidator,
    createService
  )
  .get(getServices);

router.get(
  "/getMyService",
  protect,
  allowedRoles(roles.PROVIDER),
  getMyService,
  getServices
);

router
  .route("/:id")
  .get(getServiceValidator, getService)
  .put(
    protect,
    allowedRoles(roles.PROVIDER),
    uploadServiceImages,
    resizeServiceImages,
    updateServiceValidator,
    updateService
  )
  .delete(
    protect,
    allowedRoles(roles.ADMIN, roles.PROVIDER),
    deleteServiceValidator,
    deleteService
  );

module.exports = router;
