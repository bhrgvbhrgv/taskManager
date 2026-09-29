import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="spinner" role="status" aria-label="Loading dashboard"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error" role="alert">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchStats} className="btn btn-secondary btn-sm mt-3">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const total = stats?.total || 0;
  const pending = stats?.pending || 0;
  const inProgress = stats?.in_progress || 0;
  const completed = stats?.completed || 0;
  const overdue = stats?.overdue || 0;

  const priorityLow = stats?.priority?.low || 0;
  const priorityMedium = stats?.priority?.medium || 0;
  const priorityHigh = stats?.priority?.high || 0;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome, {user?.name || 'User'}! Here is your productivity summary.
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/tasks/new" className="btn btn-primary">
            + New Task
          </Link>
          <Link to="/tasks" className="btn btn-secondary">
            View All Tasks
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card card">
          <span className="stat-label">Total Tasks</span>
          <span className="stat-value">{total}</span>
          <span className="stat-description">Across all statuses</span>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Pending</span>
          <span className="stat-value text-pending">{pending}</span>
          <Link to="/tasks?status=pending" className="stat-link">
            View pending tasks →
          </Link>
        </div>

        <div className="stat-card card">
          <span className="stat-label">In Progress</span>
          <span className="stat-value text-in-progress">{inProgress}</span>
          <Link to="/tasks?status=in_progress" className="stat-link">
            View in progress →
          </Link>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Completed</span>
          <span className="stat-value text-completed">{completed}</span>
          <Link to="/tasks?status=completed" className="stat-link">
            View completed →
          </Link>
        </div>

        <div className={`stat-card card ${overdue > 0 ? 'stat-card-alert' : ''}`}>
          <span className="stat-label">Overdue Tasks</span>
          <span className={`stat-value ${overdue > 0 ? 'text-overdue' : ''}`}>
            {overdue}
          </span>
          <span className="stat-description">
            {overdue > 0 ? 'Tasks past due requiring attention' : 'No overdue tasks!'}
          </span>
        </div>
      </div>

      {/* Progress and Visual Breakdown Section */}
      <div className="dashboard-charts-grid">
        {/* Completion Progress Card */}
        <div className="card breakdown-card">
          <h2 className="breakdown-title">Completion Rate</h2>
          <div className="progress-display">
            <div className="progress-percentage">{completionRate}%</div>
            <p className="progress-subtext">
              {completed} of {total} tasks completed
            </p>
          </div>

          <div className="progress-bar-container" role="progressbar" aria-valuenow={completionRate} aria-valuemin="0" aria-valuemax="100">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>

          <div className="status-legend">
            <div className="legend-item">
              <span className="legend-color legend-pending"></span>
              <span>Pending: {pending}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color legend-in-progress"></span>
              <span>In Progress: {inProgress}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color legend-completed"></span>
              <span>Completed: {completed}</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="card breakdown-card">
          <h2 className="breakdown-title">Priority Breakdown</h2>
          <div className="priority-bars">
            <div className="priority-row">
              <div className="priority-label-group">
                <span className="priority-name">High Priority</span>
                <span className="priority-count">{priorityHigh}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-high"
                  style={{ width: total > 0 ? `${(priorityHigh / total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="priority-row">
              <div className="priority-label-group">
                <span className="priority-name">Medium Priority</span>
                <span className="priority-count">{priorityMedium}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-medium"
                  style={{ width: total > 0 ? `${(priorityMedium / total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="priority-row">
              <div className="priority-label-group">
                <span className="priority-name">Low Priority</span>
                <span className="priority-count">{priorityLow}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-low"
                  style={{ width: total > 0 ? `${(priorityLow / total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          <div className="priority-summary">
            <p>
              {priorityHigh > 0
                ? `You have ${priorityHigh} high-priority task${priorityHigh === 1 ? '' : 's'}. Focus on these first.`
                : 'Great! No high priority tasks pending.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
