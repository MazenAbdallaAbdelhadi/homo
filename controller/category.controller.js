const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidV4 } = require("uuid");
const Category = require("../models/category.model");
const {
  createOne,
  getOne,
  paginate,
  updateOne,
  deleteOne,
} = require("../services/factory-handler");
const { uploadSingle, uploadToCloudinary } = require("../services/file-upload");

exports.uploadCategoryImage = uploadSingle("image");

exports.resizeCategoryImage = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const filename = `category-${uuidV4()}-${Date.now()}.png`;
    const buffer = await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("png")
      .png({ quality: 95 })
      .toBuffer();

    const data = await uploadToCloudinary(buffer, filename, "categories");

    // Save image into our db
    req.body.image = data.secure_url;
  }
  next();
});

/**
 * @desc get categories
 * @path GET /v1/categories
 * @access public
 */
exports.getCategories = paginate(Category, ["name"]);

/**
 * @desc get category by id
 * @path GET /v1/categories/:id
 * @access public
 */
exports.getCategory = getOne(Category);

/**
 * @desc create new category
 * @path POST /v1/categories
 * @access private [admin]
 */
exports.createCategory = createOne(Category);

/**
 * @desc update category by id
 * @path PUT /v1/categories/:id
 * @access private [admin]
 */
exports.updateCategory = updateOne(Category);

/**
 * @desc delete category by id
 * @path DELETE /v1/categories/:id
 * @access private [admin]
 */
exports.deleteCategory = deleteOne(Category);
