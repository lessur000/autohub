import {
  uploadImage,
  uploadImages,
  deleteImage,
} from "./cloudinary.service.js";
import {
  findProductById,
  createProductImage,
  findProductImageById,
  deleteProductImageRecord,
  findProductImages
} from "./product-image.repository.js";

export const uploadProductImageController = async (req, res, next) => {
  let uploadedImage;

  try {
    const { productId } = req.params;
    const { altText = "", sortOrder = "0" } = req.body;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        productId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const parsedSortOrder = Number(sortOrder);

    if (!Number.isSafeInteger(parsedSortOrder) || parsedSortOrder < 0) {
      return res.status(400).json({
        success: false,
        message: "sortOrder must be a non-negative integer.",
      });
    }

    if (typeof altText !== "string" || altText.length > 250) {
      return res.status(400).json({
        success: false,
        message: "altText must not exceed 250 characters.",
      });
    }

    const product = await findProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    uploadedImage = await uploadImage(req.file, "autohub/products");

    try {
      const imageRecord = await createProductImage({
        productId,
        imageUrl: uploadedImage.url,
        publicId: uploadedImage.publicId,
        altText: altText.trim(),
        sortOrder: parsedSortOrder,
      });

      return res.status(201).json({
        success: true,
        message: "Product image uploaded successfully.",
        data: {
          product,
          image: imageRecord,
        },
      });
    } catch (databaseError) {
      // Compensate for a failed database insert.
      try {
        await deleteImage(uploadedImage.publicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError);
      }

      throw databaseError;
    }
  } catch (error) {
    return next(error);
  }
};


export const getProductImagesController = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await findProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const images = await findProductImages(productId);

    return res.status(200).json({
      success: true,
      message: "Product images retrieved successfully.",
      data: {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
        },
        images,
        count: images.length,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const uploadSingleImageController = async (req, res, next) => {
  try {
    const image = await uploadImage(req.file, "autohub");

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: image,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleImagesController = async (req, res, next) => {
  try {
    const images = await uploadImages(req.files, "autohub");

    return res.status(201).json({
      success: true,
      message: "Images uploaded successfully.",
      data: {
        count: images.length,
        images,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImageController = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    // Add resource ownership/authorization checks before deletion.
    const result = await deleteImage(publicId);

    return res.status(200).json({
      success: true,
      message: "Image deletion processed.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductImageController = async (req, res, next) => {
  try {
    const { imageId } = req.params;

    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!UUID_REGEX.test(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID.",
      });
    }

    const image = await findProductImageById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Product image not found.",
      });
    }

    if (!image.cloudinary_public_id) {
      return res.status(409).json({
        success: false,
        message: "Image has no Cloudinary public ID.",
      });
    }

    // Delete the Cloudinary asset first.
    const result = await deleteImage(image.cloudinary_public_id);

    // Remove the database record only after Cloudinary deletion succeeds
    // or confirms that the asset was already absent.
    const deletedRecord = await deleteProductImageRecord(imageId);

    if (!deletedRecord) {
      return res.status(409).json({
        success: false,
        message:
          "Cloudinary image was processed, but the database record was not deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product image deleted successfully.",
      data: {
        id: deletedRecord.id,
        productId: deletedRecord.product_id,
        publicId: result.publicId,
      },
    });
  } catch (error) {
    return next(error);
  }
};
