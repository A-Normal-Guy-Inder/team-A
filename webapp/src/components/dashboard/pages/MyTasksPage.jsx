import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TaskCard from "../cards/TaskCard";
import Pagination from "../Pagination";
import { fetchMyTasks, selectMyTasks } from "../../../features/tasks/tasksSlice";

const MyTasksPage = ({ onAddTask, onEditTask }) => {
    const dispatch = useDispatch();
    const myTasks = useSelector(selectMyTasks);

    const handlePageChange = useCallback((page) => dispatch(fetchMyTasks({ page })), [dispatch]);

    const isEmpty = myTasks.items.length === 0;
    const isLoading = myTasks.status === "loading";

    return (
        <>
            <div className="my-tasks-header">
                <button className="add-task-btn" onClick={onAddTask}>+ Add New Task</button>
            </div>

            <div className="feed my-tasks-section">
                {isEmpty ? (
                    <div className="empty-state">
                        {isLoading ? (
                            <h3>Loading your tasks…</h3>
                        ) : (
                            <>
                                <h3>You haven’t created any tasks yet</h3>
                                <p>Start by adding a new task and get help from others.</p>
                            </>
                        )}
                    </div>
                ) : (
                    myTasks.items.map((task) => (
                        <TaskCard key={task._id} task={task} editable onEdit={onEditTask} />
                    ))
                )}
            </div>

            <Pagination meta={myTasks.meta} onChange={handlePageChange} disabled={isLoading} />
        </>
    );
};

export default MyTasksPage;
