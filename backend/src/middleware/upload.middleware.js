import multer from "multer";

const MAX_FILE_SIZE = Number(
  process.env.CLOUDINARY_MAX_FILE_SIZE || 5 * 1024 * 1024,
);

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error(
      "Only JPEG, PNG, WebP, and AVIF images are allowed.",
    );

    error.statusCode = 400;

    return callback(error);
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
});

export const uploadSingleImage = upload.single("image");
export const uploadMultipleImages = upload.array("images", 10);

export default upload;
