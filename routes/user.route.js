const { Router } = require("express");
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadProfileImage,
  resizeProfileImage,
  getLoggedUser,
  updateLoggedUser,
  deleteLoggedUser,
  updateLoggedUserPassword,
  updateUserPassword,
  setFCM,
} = require("../controller/user.controller");
const {
  createUserValidator,
  deleteUserValidator,
  getUserValidator,
  updateUserValidator,
  updateLoggedUserValidator,
  updateUserPasswordValidator,
  updateLoggedUserPasswordValidator,
  setFCMValidator,
} = require("../utils/validator/user.validator");
const { protect, allowedRoles } = require("../services/auth");
const roles = require("../config/roles");

const router = Router();

router.use(protect);

router.get("/getMe", getLoggedUser, getUser);
router.put(
  "/updateMe",
  uploadProfileImage,
  resizeProfileImage,
  updateLoggedUserValidator,
  updateLoggedUser,
  updateUser
);
router.put(
  "/changeMyPassword",
  updateLoggedUserPasswordValidator,
  updateLoggedUserPassword
);
router.delete("/deleteMe", deleteLoggedUser, deleteUser);

router.post("/fcm-token", setFCMValidator, setFCM);

router.use(allowedRoles(roles.ADMIN));
router
  .route("/")
  .post(uploadProfileImage, resizeProfileImage, createUserValidator, createUser)
  .get(getUsers);

router
  .route("/:id")
  .get(getUserValidator, getUser)
  .put(uploadProfileImage, resizeProfileImage, updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

router.put(
  "/:id/changePassword",
  updateUserPasswordValidator,
  updateUserPassword
);

module.exports = router;
