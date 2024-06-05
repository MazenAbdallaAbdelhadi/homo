const mongoose = require("mongoose");
const Product = require("./service.model");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    ratings: {
      type: Number,
      min: [1, "Min ratings value is 1.0"],
      max: [5, "Max ratings value is 5.0"],
      required: [true, "review ratings required"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to user"],
    },
    // parent reference (one to many)
    service: {
      type: mongoose.Schema.ObjectId,
      ref: "Service",
      required: [true, "Review must belong to product"],
    },
  },
  { timestamps: true }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name email profileImage" });
  next();
});

reviewSchema.statics.calcAverageRatingsAndQuantity = async function (
  serviceId
) {
  const result = await this.aggregate([
    // Stage 1 : get all reviews in specific service
    {
      $match: { service: serviceId },
    },
    // Stage 2: Grouping reviews based on serviceID and calc avgRatings, ratingsQuantity
    {
      $group: {
        _id: "service",
        avgRatings: { $avg: "$ratings" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(serviceId, {
      ratingsAverage: result[0].avgRatings,
      ratingsQuantity: result[0].ratingsQuantity,
    });
  } else {
    await Product.findByIdAndUpdate(serviceId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.service);
});

reviewSchema.post("findOneAndDelete", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.service);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
