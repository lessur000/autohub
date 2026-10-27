export const validateUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select an image to upload.",
    });
  }

  next();
};

export const validateMultipleUpload = (req, res, next) => {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please select at least one image to upload.",
    });
  }

  next();
};

export const validateDeleteImage = (req, res, next) => {
  const { publicId } = req.body;

  if (
    typeof publicId !== "string" ||
    !publicId.trim() ||
    publicId.length > 500
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid publicId is required.",
    });
  }

  next();
};


const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateProductId = (req, res, next) => {
  if (!UUID_REGEX.test(req.params.productId ?? "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID.",
    });
  }

  next();
};

export const validateImageId = (req, res, next) => {
  if (!UUID_REGEX.test(req.params.imageId ?? "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid image ID.",
    });
  }

  next();
};

