import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskList } from '../pages/TaskList';
import * as apiModule from '../services/api';

vi.mock('../services/api', () => ({
  taskService: {
    listTasks: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

describe('TaskList Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task list with items returned from API', async () => {
    apiModule.taskService.listTasks.mockResolvedValueOnce({
      tasks: [
        {
          id: 1,
          title: 'Implement Database Migrations',
          description: 'Create PostgreSQL migration scripts',
          status: 'completed',
          priority: 'high',
          due_date: '2026-10-15T00:00:00.000Z',
          created_at: '2026-09-29T00:00:00.000Z',
        },
        {
          id: 2,
          title: 'Design Dashboard UI',
          description: 'Use pure CSS for visual representation',
          status: 'pending',
          priority: 'medium',
          due_date: null,
          created_at: '2026-09-29T00:00:00.000Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    render(
      <BrowserRouter>
        <TaskList />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading your tasks/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Implement Database Migrations')).toBeInTheDocument();
      expect(screen.getByText('Design Dashboard UI')).toBeInTheDocument();
      expect(screen.getByText(/showing 2 of 2 tasks/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no tasks exist', async () => {
    apiModule.taskService.listTasks.mockResolvedValueOnce({
      tasks: [],
      total: 0,
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
      expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first task/i)).toBeInTheDocument();
    });
  });
});
