import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTask } from '../pages/CreateTask';
import { TaskList } from '../pages/TaskList';
import * as apiModule from '../services/api';

vi.mock('../services/api', () => ({
  taskService: {
    createTask: vi.fn(),
    listTasks: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

describe('Task Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CreateTask Component', () => {
    it('validates required title field', async () => {
      render(
        <BrowserRouter>
          <CreateTask />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
      expect(apiModule.taskService.createTask).not.toHaveBeenCalled();
    });

    it('submits valid task and calls createTask service', async () => {
      apiModule.taskService.createTask.mockResolvedValueOnce({
        task: { id: 10, title: 'New Valid Task' },
      });

      render(
        <BrowserRouter>
          <CreateTask />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: 'New Valid Task' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Detailed task description' },
      });
      fireEvent.change(screen.getByLabelText(/status/i), {
        target: { value: 'in_progress' },
      });
      fireEvent.change(screen.getByLabelText(/priority/i), {
        target: { value: 'high' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(apiModule.taskService.createTask).toHaveBeenCalledWith({
          title: 'New Valid Task',
          description: 'Detailed task description',
          status: 'in_progress',
          priority: 'high',
          due_date: null,
        });
      });
    });
  });

  describe('Delete Modal Confirmation in TaskList', () => {
    it('opens delete confirmation modal and can cancel', async () => {
      apiModule.taskService.listTasks.mockResolvedValueOnce({
        tasks: [
          {
            id: 1,
            title: 'Task To Delete',
            status: 'pending',
            priority: 'medium',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      render(
        <BrowserRouter>
          <TaskList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Task To Delete')).toBeInTheDocument();
      });

      // Click delete button
      fireEvent.click(screen.getByRole('button', { name: /delete task to delete/i }));

      // Modal should appear
      expect(screen.getByRole('heading', { name: /delete task/i })).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete the task/i)).toBeInTheDocument();

      // Click Cancel
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Modal is closed
      expect(screen.queryByText(/are you sure you want to delete the task/i)).not.toBeInTheDocument();
      expect(apiModule.taskService.deleteTask).not.toHaveBeenCalled();
    });
  });
});
