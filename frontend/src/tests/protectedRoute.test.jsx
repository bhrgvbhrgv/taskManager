import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  authService: {
    getMe: vi.fn(),
  },
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when user is not authenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret Protected Area</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Secret Protected Area')).not.toBeInTheDocument();
  });
});
