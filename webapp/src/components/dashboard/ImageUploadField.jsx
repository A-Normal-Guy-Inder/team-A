import React, { memo, useCallback } from "react";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * File picker with drag-and-drop and a live preview.
 *
 * Type and size are checked here as well as on the server so an oversized file
 * is rejected instantly instead of after a full upload round-trip.
 */
const ImageUploadField = ({ inputId = "task-image", preview, onSelect, onRemove }) => {
    const handleFile = useCallback(
        (file) => {
            if (!file) return;

            if (!ACCEPTED.includes(file.type)) {
                toast.warn("Please choose a JPG, PNG, WEBP or GIF image");
                return;
            }
            if (file.size > MAX_BYTES) {
                toast.warn("Image is too large. Maximum size is 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => onSelect(file, reader.result);
            reader.readAsDataURL(file);
        },
        [onSelect]
    );

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) handleFile(file);
            else toast.warn("Please drop an image file");
        },
        [handleFile]
    );

    if (preview) {
        return (
            <div className="image-preview-container">
                <img src={preview} alt="Preview" className="image-preview" />
                <button type="button" className="btn-remove-image" onClick={onRemove}>
                    ✕ Remove Image
                </button>
            </div>
        );
    }

    return (
        <div className="file-upload" onDragOver={handleDragOver} onDrop={handleDrop}>
            <input
                type="file"
                id={inputId}
                accept="image/*"
                onChange={(e) => handleFile(e.target.files[0])}
            />
            <label htmlFor={inputId} className="file-upload-label">
                <span><Upload /></span>Upload a file or drag and drop
                <span>PNG, JPG, GIF up to 5MB</span>
            </label>
        </div>
    );
};

export default memo(ImageUploadField);
