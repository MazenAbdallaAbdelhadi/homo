const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");
const { recordNotFound } = require("../utils/response/errors");

/**
 * @desc get categories
 * @path GET /v1/chat
 * @access private
 */
exports.getMyChats = asyncHandler(async (req, res) => {
  const { user } = req;

  const chats = await user.populate({
    path: "chats",
    select: "name email profileImage",
  });

  res.success({ data: chats.chats.reverse() });
});

/**
 * @desc create new chat
 * @path POST /v1/chat/:id
 * @access private
 */
exports.createNewChat = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(recordNotFound({ message: "user not found" }));
  }

  if (!user.chats.includes(req.user._id)) {
    user.chats.push(req.user._id);
    await user.save();
  }

  if (!req.user.chats.includes(user._id)) {
    req.user.chats.push(user._id);
    await req.user.save();
  }

  res.success({ message: "Room created successfully" });
});
