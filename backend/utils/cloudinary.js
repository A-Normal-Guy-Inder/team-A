const fs = require("fs");
const cloudinary = require("../config/cloudinary");

const TRANSFORMATIONS = {
    tasks: [
        { width: 400, height: 225, crop: "fill", gravity: "auto" },
        { quality: "auto:best", fetch_format: "auto" },
    ],
    profile_pictures: [
        { width: 150, height: 150, crop: "fill", gravity: "auto" },
        { quality: "auto:best", fetch_format: "auto" },
    ],
};

async function safeUnlink(filePath) {
    if (!filePath) return;
    try {
        await fs.promises.unlink(filePath);
    } catch (err) {
        if (err.code !== "ENOENT") {
            console.error("[cloudinary] Temp file cleanup failed:", err.message);
        }
    }
}

async function uploadToCloudinary(localFilePath, folder) {
    if (!localFilePath) return null;

    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder,
            resource_type: "image",
            transformation: TRANSFORMATIONS[folder] || [],
        });

        return { secure_url: result.secure_url, public_id: result.public_id };
    } catch (err) {
        console.error("[cloudinary] Upload failed:", err.message);
        throw new Error("Failed to upload image");
    } finally {
        await safeUnlink(localFilePath);
    }
}

async function deleteFromCloudinary(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("[cloudinary] Delete failed:", err.message);
    }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
