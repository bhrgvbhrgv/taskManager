import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { taskService } from '../services/api';

export const TaskList = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.listTasks({
        search,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        order,
        page,
        limit,
      });

      setTasks(data.tasks);
      setTotalPages(data.totalPages);
      setTotalTasks(data.total);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sortBy, order, page, limit]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on new search
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('created_at');
    setOrder('DESC');
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await taskService.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      // Refresh task list
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'No due date';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            Manage, organize, and track your ongoing assignments.
          </p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary">
          + Create New Task
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="card filters-card">
        <form onSubmit={handleSearchSubmit} className="filters-grid">
          <div className="form-group search-group">
            <label htmlFor="search" className="form-label">
              Search Tasks
            </label>
            <div className="search-input-wrapper">
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description..."
                className="form-input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="btn-clear-search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="statusFilter" className="form-label">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priorityFilter" className="form-label">
              Priority
            </label>
            <select
              id="priorityFilter"
              value={priorityFilter}
              onChange={handleFilterChange(setPriorityFilter)}
              className="form-select"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sortBy" className="form-label">
              Sort By
            </label>
            <div className="sort-controls">
              <select
                id="sortBy"
                value={sortBy}
                onChange={handleFilterChange(setSortBy)}
                className="form-select"
              >
                <option value="created_at">Created Date</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="title">Title</option>
              </select>
              <button
                type="button"
                onClick={() => setOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
                className="btn btn-secondary btn-icon"
                title={`Order: ${order === 'ASC' ? 'Ascending' : 'Descending'}`}
                aria-label={`Toggle sort order. Currently ${order}`}
              >
                {order === 'ASC' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </form>

        {(search || statusFilter || priorityFilter || sortBy !== 'created_at' || order !== 'DESC') && (
          <div className="active-filters">
            <span className="active-filters-label">Active Filters:</span>
            {search && <span className="filter-tag">Search: "{search}"</span>}
            {statusFilter && <span className="filter-tag">Status: {statusFilter}</span>}
            {priorityFilter && <span className="filter-tag">Priority: {priorityFilter}</span>}
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-link btn-sm"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Task List Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" role="status" aria-label="Loading tasks"></div>
          <p>Loading your tasks...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchTasks} className="btn btn-secondary btn-sm mt-2">
            Try Again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📋</div>
          <h2 className="empty-title">No tasks found</h2>
          <p className="empty-description">
            {search || statusFilter || priorityFilter
              ? 'No tasks match your current filter criteria. Try adjusting or clearing your filters.'
              : "You haven't created any tasks yet. Get started by adding your first task!"}
          </p>
          {search || statusFilter || priorityFilter ? (
            <button type="button" onClick={handleResetFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          ) : (
            <Link to="/tasks/new" className="btn btn-primary">
              Create Your First Task
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="tasks-meta">
            <span>
              Showing {tasks.length} of {totalTasks} task{totalTasks === 1 ? '' : 's'}
            </span>
          </div>

          <div className="tasks-grid">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-card card ${task.status === 'completed' ? 'task-completed' : ''}`}
              >
                <div className="task-header">
                  <div className="task-badges">
                    <span className={`badge badge-status badge-${task.status}`}>
                      {task.status === 'in_progress' ? 'In Progress' : task.status}
                    </span>
                    <span className={`badge badge-priority badge-${task.priority}`}>
                      {task.priority}
                    </span>
                    {isOverdue(task) && (
                      <span className="badge badge-overdue">Overdue</span>
                    )}
                  </div>
                  <div className="task-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/tasks/${task.id}/edit`)}
                      className="btn btn-secondary btn-sm"
                      aria-label={`Edit ${task.title}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskToDelete(task)}
                      className="btn btn-danger btn-sm"
                      aria-label={`Delete ${task.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <h3 className="task-title">{task.title}</h3>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-footer">
                  <span className={`task-due ${isOverdue(task) ? 'due-overdue' : ''}`}>
                    📅 Due: {formatDate(task.due_date)}
                  </span>
                  <span className="task-created">
                    Created: {formatDate(task.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="btn btn-secondary btn-sm"
                aria-label="Previous page"
              >
                ← Previous
              </button>

              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="btn btn-secondary btn-sm"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-card">
            <h2 id="modal-title" className="modal-title">
              Delete Task
            </h2>
            <p className="modal-text">
              Are you sure you want to delete the task <strong>"{taskToDelete.title}"</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setTaskToDelete(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="btn btn-danger"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
