const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidV4 } = require("uuid");
const Service = require("../models/service.model");
const {
  createOne,
  getOne,
  paginate,
  updateOne,
  deleteOne,
} = require("../services/factory-handler");
const { uploadMix, uploadToCloudinary } = require("../services/file-upload");

exports.uploadServiceImages = uploadMix([
  {
    name: "coverImage",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);

exports.resizeServiceImages = asyncHandler(async (req, res, next) => {
  if (req.files?.coverImage) {
    const coverImageFileName = `product-${uuidV4()}-${Date.now()}-coverImage.jpeg`;

    const img = await sharp(req.files.coverImage[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toBuffer();

    const data = await uploadToCloudinary(img, coverImageFileName, "services");
    // Save image into our db
    req.body.coverImage = data.secure_url;
  }

  if (req.files?.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `service-${uuidV4()}-${Date.now()}-${index + 1}`;

        const image = await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toBuffer();

        const data = await uploadToCloudinary(image, imageName, "services");
        // Save image into our db
        req.body.images.push(data.secure_url);
      })
    );
  }

  next();
});

/**
 * @desc get stores
 * @path GET /v1/service
 * @access public
 */
exports.getServices = paginate(Service, ["name", "description"]);

/**
 * @desc get product by id
 * @path GET /v1/service/:id
 * @access public
 */
exports.getService = getOne(Service);

/**
 * @desc create new product
 * @path POST /v1/service
 * @access private [vendor]
 */
exports.createService = createOne(Service);

/**
 * @desc update product by id
 * @path PUT /v1/service/:id
 * @access private [owner]
 */
exports.updateService = updateOne(Service);

/**
 * @desc delete product by id
 * @path DELETE /v1/service/:id
 * @access private [admin | owner]
 */
exports.deleteService = deleteOne(Service);
