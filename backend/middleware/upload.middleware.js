const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const TEMP_DIR = env.upload.tempDir;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function ensureTempDir() {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
ensureTempDir();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            ensureTempDir();
            cb(null, TEMP_DIR);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeExtension = ALLOWED_EXTENSIONS.has(extension) ? extension : ".img";
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
    },
});

function fileFilter(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(extension)) {
        return cb(ApiError.badRequest("Only JPG, PNG, WEBP or GIF images are allowed"));
    }
    return cb(null, true);
}

const upload = multer({
    storage,
    limits: { files: 1, fileSize: env.upload.maxFileSizeBytes, fields: 25 },
    fileFilter,
});

async function cleanupTempFile(file) {
    if (!file?.path) return;
    try {
        await fs.promises.unlink(file.path);
    } catch (err) {
        if (err.code !== "ENOENT") {
            console.error("[upload] Failed to remove temp file:", err.message);
        }
    }
}

function cleanupOnResponse(req, res, next) {
    res.on("finish", () => {
        cleanupTempFile(req.file);
    });
    next();
}

const single = (field) => [upload.single(field), cleanupOnResponse];

module.exports = { upload, single, cleanupTempFile, TEMP_DIR };
