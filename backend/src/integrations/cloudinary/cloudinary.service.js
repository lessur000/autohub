import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import cloudinary from "./cloudinary.config.js";

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result) {
          return reject(new Error("Cloudinary returned no upload result."));
        }

        resolve(result);
      },
    );

    Readable.from(buffer).pipe(stream);
  });

export const uploadImage = async (file, folder = "autohub") => {
  if (!file?.buffer) {
    const error = new Error("An image file is required.");
    error.statusCode = 400;
    throw error;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Unsupported image format.");
    error.statusCode = 400;
    throw error;
  }

  const result = await uploadBuffer(file.buffer, {
    folder,
    public_id: randomUUID(),
    resource_type: "image",
    overwrite: false,
    unique_filename: true,
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    resourceType: result.resource_type,
  };
};

export const uploadImages = async (files, folder = "autohub") => {
  if (!Array.isArray(files) || files.length === 0) {
    const error = new Error("At least one image is required.");
    error.statusCode = 400;
    throw error;
  }

  const uploadedImages = [];

  try {
    for (const file of files) {
      const image = await uploadImage(file, folder);
      uploadedImages.push(image);
    }

    return uploadedImages;
  } catch (error) {
    // Avoid leaving partial uploads behind if a batch fails.
    await Promise.allSettled(
      uploadedImages.map((image) => deleteImage(image.publicId)),
    );

    throw error;
  }
};

export const deleteImage = async (publicId) => {
  if (
    typeof publicId !== "string" ||
    !publicId.trim() ||
    publicId.length > 500
  ) {
    const error = new Error("A valid image public ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (!["ok", "not found"].includes(result.result)) {
    throw new Error("Cloudinary could not delete the image.");
  }

  return {
    publicId,
    result: result.result,
  };
};
