const fs = require("fs");
const cloudinary = require("../config/cloudinary");

/**
 * Per-folder delivery transformations. Keeping them here (rather than inline at
 * each call site) means the two upload paths can never drift apart.
 */
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

/**
 * Uploads a local file and always removes it afterwards, success or failure.
 * Returns `{ secure_url, public_id }`.
 */
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

/**
 * Best-effort delete. A stale remote asset must never fail the user's request,
 * so failures are logged rather than propagated.
 */
async function deleteFromCloudinary(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("[cloudinary] Delete failed:", err.message);
    }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
