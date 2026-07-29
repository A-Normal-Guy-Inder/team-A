import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ReceivedRequestCard from "../cards/ReceivedRequestCard";
import Pagination from "../Pagination";
import {
    fetchReceivedRequests,
    respondToRequest,
    selectActionInFlight,
    selectReceivedRequests,
} from "../../../features/requests/requestsSlice";
import { fetchMyTasks } from "../../../features/tasks/tasksSlice";

const ReceivedRequestsPage = () => {
    const dispatch = useDispatch();
    const received = useSelector(selectReceivedRequests);
    const actionInFlight = useSelector(selectActionInFlight);

    const respond = useCallback(
        async (requestId, status) => {
            if (!requestId) return;

            const result = await dispatch(respondToRequest({ requestId, status }));

            if (respondToRequest.rejected.match(result)) {
                toast.error(result.payload);
                return;
            }

            toast.success(status === "accepted" ? "Request accepted! ✅" : "Request rejected");

            dispatch(fetchReceivedRequests());
            if (status === "accepted") dispatch(fetchMyTasks());
        },
        [dispatch]
    );

    const handleAccept = useCallback((id) => respond(id, "accepted"), [respond]);
    const handleReject = useCallback((id) => respond(id, "rejected"), [respond]);
    const handlePageChange = useCallback((page) => dispatch(fetchReceivedRequests({ page })), [dispatch]);

    const isLoading = received.status === "loading";

    return (
        <div className="requests-page">
            <h2>Incoming Requests</h2>
            <p className="page-subtitle">People who want to help with your tasks</p>

            {isLoading && received.items.length === 0 ? (
                <p style={{ padding: "20px" }}>Loading requests...</p>
            ) : received.items.length === 0 ? (
                <p style={{ padding: "20px" }}>No requests yet. Create a task to get started!</p>
            ) : (
                <>
                    <div className="feed">
                        {received.items.map((request) => (
                            <ReceivedRequestCard
                                key={request.requestId}
                                request={request}
                                onAccept={handleAccept}
                                onReject={handleReject}
                                pendingAction={actionInFlight[request.requestId]}
                            />
                        ))}
                    </div>

                    <Pagination meta={received.meta} onChange={handlePageChange} disabled={isLoading} />
                </>
            )}
        </div>
    );
};

export default ReceivedRequestsPage;
