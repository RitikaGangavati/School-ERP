const cloudinary = require("./cloudinary");

const EXT_BY_MIME = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const uploadBuffer = (file, folder, kind) =>
  new Promise((resolve, reject) => {
    const options = { folder: `school_erp/${folder}` };

    if (kind === "image") {
      options.resource_type = "image";
      options.transformation = [{ width: 800, height: 800, crop: "limit" }];
    } else {
      // raw files keep the extension in the public_id, so the URL ends in .pdf/.docx
      options.resource_type = "raw";
      options.public_id = `${Date.now()}-${Math.round(Math.random() * 1e9)}${EXT_BY_MIME[file.mimetype]}`;
    }

    cloudinary.uploader
      .upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)))
      .end(file.buffer);
  });

module.exports = uploadToCloudinary = uploadBuffer;