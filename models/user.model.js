const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const roles = require("../config/roles");
const { enumFormObject } = require("../utils/helper/enum-from-object");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    bio: String,
    profileImage: String,
    phone: String,
    password: String,
    passwordChangedAt: Date,
    passwordResetSecret: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: enumFormObject(roles),
      default: roles.CUSTOMER,
    },
    // child reference (one to many)
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Service",
      },
    ],
    addresses: [
      {
        id: { type: mongoose.Schema.ObjectId },
        alias: String,
        details: String,
        phone: String,
        city: String,
        postalCode: String,
      },
    ],
    providerAccount: {
      isActive: {
        type: Boolean,
        default: true,
      },
      balance: {
        type: Number,
        default: 0.0,
      },
      commissionRate: {
        type: Number,
        default: 0.1, // 10% commission for the platform
      },
    },
  },
  {
    timestamps: true,
  }
);

const setImageURL = (doc) => {
  if (doc.profileImage) {
    const imageUrl = `${process.env.BASE_URL}/users/${doc.profileImage}`;
    doc.profileImage = imageUrl;
  }
};

userSchema.post("init", function (doc) {
  setImageURL(doc);
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.toJSON = function () {
  const userObj = this.toObject();

  delete userObj.password;

  return userObj;
};

userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
