import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import * as apiModule from '../services/api';

vi.mock('../services/api', () => ({
  dashboardService: {
    getStats: vi.fn(),
  },
  authService: {
    getMe: vi.fn(),
  },
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard statistics cards and completion rate', async () => {
    apiModule.dashboardService.getStats.mockResolvedValueOnce({
      total: 10,
      pending: 4,
      in_progress: 2,
      completed: 4,
      overdue: 1,
      priority: {
        low: 2,
        medium: 5,
        high: 3,
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      // Total tasks
      expect(screen.getByText('10')).toBeInTheDocument();
      // Completed tasks
      expect(screen.getByText('40%')).toBeInTheDocument();
      // Overdue alert
      expect(screen.getByText(/tasks past due requiring attention/i)).toBeInTheDocument();
      // Priority breakdown headings
      expect(screen.getByText(/high priority/i)).toBeInTheDocument();
      expect(screen.getByText(/medium priority/i)).toBeInTheDocument();
      expect(screen.getByText(/low priority/i)).toBeInTheDocument();
    });
  });
});
