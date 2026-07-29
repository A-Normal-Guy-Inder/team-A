import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TaskCard from "../cards/TaskCard";
import Pagination from "../Pagination";
import { fetchFeed, selectFeed } from "../../../features/tasks/tasksSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";

const FeedPage = ({ onRequestTask }) => {
    const dispatch = useDispatch();
    const feed = useSelector(selectFeed);
    const user = useSelector(selectCurrentUser);

    const handlePageChange = useCallback((page) => dispatch(fetchFeed({ page })), [dispatch]);

    const isEmpty = feed.items.length === 0;
    const isLoading = feed.status === "loading";

    return (
        <>
            <div className="feed">
                {isEmpty ? (
                    <div className="empty-state-feed">
                        {isLoading ? (
                            <h3>Loading tasks…</h3>
                        ) : (
                            <>
                                <h3>No tasks available right now</h3>
                                <p>Be the first to add a task or check back later.</p>
                            </>
                        )}
                    </div>
                ) : (
                    feed.items.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            currentUserId={user?._id}
                            onRequestTask={onRequestTask}
                        />
                    ))
                )}
            </div>

            <Pagination meta={feed.meta} onChange={handlePageChange} disabled={isLoading} />
        </>
    );
};

export default FeedPage;
