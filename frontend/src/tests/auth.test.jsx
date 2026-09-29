import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';
import * as apiModule from '../services/api';

vi.mock('../services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
  taskService: {},
  dashboardService: {},
  healthService: {},
}));

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Page', () => {
    it('renders login form with inputs and submit button', () => {
      renderWithProviders(<Login />);

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/demo@example.com/i)).toBeInTheDocument();
    });

    it('validates required fields on submit', async () => {
      renderWithProviders(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
      expect(apiModule.authService.login).not.toHaveBeenCalled();
    });

    it('submits valid credentials and calls login service', async () => {
      apiModule.authService.login.mockResolvedValueOnce({
        token: 'mock_jwt_token',
        user: { id: 1, name: 'Alice', email: 'alice@example.com' },
      });

      renderWithProviders(<Login />);

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'alice@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(apiModule.authService.login).toHaveBeenCalledWith({
          email: 'alice@example.com',
          password: 'Password123!',
        });
      });
    });
  });

  describe('Register Page', () => {
    it('renders registration form inputs', () => {
      renderWithProviders(<Register />);

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('validates password mismatch on register', async () => {
      renderWithProviders(<Register />);

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Bob Smith' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'bob@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'DifferentPassword!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
      expect(apiModule.authService.register).not.toHaveBeenCalled();
    });
  });
});
