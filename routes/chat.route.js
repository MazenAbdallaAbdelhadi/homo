const { Router } = require("express");

const { createNewChat, getMyChats } = require("../controller/chat.controller");
const { protect } = require("../services/auth");

const router = Router();

router.get("/", protect, getMyChats);
router.post("/:id", protect, createNewChat);

module.exports = router;
