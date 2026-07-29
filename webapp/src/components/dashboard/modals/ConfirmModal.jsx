import React, { memo } from "react";

const ConfirmModal = ({ message, confirmLabel = "YES", cancelLabel = "NO", onConfirm, onCancel, busy }) => (
    <div className="modal-overlay">
        <div className="modal">
            <p style={{ textAlign: "center", marginBottom: "20px" }}>{message}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                <button onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
                <button onClick={onCancel} disabled={busy}>{cancelLabel}</button>
            </div>
        </div>
    </div>
);

export default memo(ConfirmModal);
