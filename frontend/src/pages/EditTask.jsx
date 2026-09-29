import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { taskService } from '../services/api';

export const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
  });

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTask = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await taskService.getTask(id);
        if (isMounted) {
          const task = response.task;
          let formattedDueDate = '';
          if (task.due_date) {
            // Format to YYYY-MM-DD for date input
            const d = new Date(task.due_date);
            formattedDueDate = d.toISOString().split('T')[0];
          }

          setFormData({
            title: task.title || '',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            due_date: formattedDueDate,
          });
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to load task details');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTask();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length > 255) {
      newErrors.title = 'Title cannot exceed 255 characters';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      };

      await taskService.updateTask(id, payload);
      navigate('/tasks');
    } catch (err) {
      setServerError(err.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="spinner" role="status" aria-label="Loading task"></div>
        <p>Loading task details...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-container">
        <div className="alert alert-error" role="alert">
          <h2>Error Loading Task</h2>
          <p>{fetchError}</p>
          <div className="mt-3">
            <Link to="/tasks" className="btn btn-secondary">
              Back to Tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container form-page">
      <div className="card form-card">
        <div className="form-header">
          <h1 className="form-title">Edit Task</h1>
          <p className="form-subtitle">Update your task information.</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="task-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Task Title <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              required
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="form-textarea"
            />
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group form-col">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="due_date" className="form-label">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <Link to="/tasks" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
