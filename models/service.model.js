const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01, // Minimum non-zero price
    },
    coverImage: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      max: 5,
      trim: true, // Ensure image URLs are trimmed
    },
    sold: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be above or equal 1.0"],
      max: [5, "Rating must be below or equal 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // to enable virtual populate
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

serviceSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "service",
  localField: "_id",
});

// Pre-find hook to populate category name
serviceSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "name",
  });
  this.populate({
    path: "provider",
  });
  next();
});

// const setImageURL = (doc) => {
//   if (doc.imageCover) {
//     const imageUrl = `${process.env.BASE_URL}/products/${doc.imageCover}`;
//     doc.imageCover = imageUrl;
//   }
//   if (doc.images) {
//     const imagesList = [];
//     doc.images.forEach((image) => {
//       const imageUrl = `${process.env.BASE_URL}/products/${image}`;
//       imagesList.push(imageUrl);
//     });
//     doc.images = imagesList;
//   }
// };

// // findOne, findAll and update
// serviceSchema.post("init", (doc) => {
//   setImageURL(doc);
// });

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
