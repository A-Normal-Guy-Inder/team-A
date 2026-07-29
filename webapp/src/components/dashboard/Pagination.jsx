import React, { memo } from "react";

const Pagination = ({ meta, onChange, disabled = false }) => {
    if (!meta || meta.totalPages <= 1) return null;

    const { page, totalPages, total, hasNextPage, hasPrevPage } = meta;

    return (
        <div className="pagination">
            <button
                type="button"
                className="pagination-btn"
                onClick={() => onChange(page - 1)}
                disabled={disabled || !hasPrevPage}
            >
                ‹ Prev
            </button>

            <span className="pagination-info">
                Page {page} of {totalPages}
                {typeof total === "number" && <span className="pagination-total"> • {total} total</span>}
            </span>

            <button
                type="button"
                className="pagination-btn"
                onClick={() => onChange(page + 1)}
                disabled={disabled || !hasNextPage}
            >
                Next ›
            </button>
        </div>
    );
};

export default memo(Pagination);
