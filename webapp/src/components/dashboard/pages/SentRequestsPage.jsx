import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import SentRequestCard from "../cards/SentRequestCard";
import Pagination from "../Pagination";
import { fetchSentRequests, selectSentRequests } from "../../../features/requests/requestsSlice";

const SentRequestsPage = () => {
    const dispatch = useDispatch();
    const sent = useSelector(selectSentRequests);

    const handlePageChange = useCallback((page) => dispatch(fetchSentRequests({ page })), [dispatch]);

    const isLoading = sent.status === "loading";

    return (
        <div className="my-requests-page">
            <h2>My Requests</h2>
            <p className="page-subtitle">Track the help requests you've sent</p>

            {isLoading && sent.items.length === 0 ? (
                <p style={{ padding: "20px" }}>Loading requests...</p>
            ) : sent.items.length === 0 ? (
                <p style={{ padding: "20px" }}>
                    You haven't requested any tasks yet. Go to Feed to request!
                </p>
            ) : (
                <>
                    <div className="my-requests-grid">
                        {sent.items.map((request) => (
                            <SentRequestCard key={request.requestId} request={request} />
                        ))}
                    </div>

                    <Pagination meta={sent.meta} onChange={handlePageChange} disabled={isLoading} />
                </>
            )}
        </div>
    );
};

export default SentRequestsPage;
