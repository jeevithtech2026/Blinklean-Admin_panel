import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Mock useAuth context hook
jest.mock('../context/AuthContext');

describe('ProtectedRoute Component Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated admins with empty credentials back to the login view', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/dashboard/partners']}>
        <Routes>
          <Route 
            path="/dashboard/partners" 
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Administrative Panel Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<div data-testid="login-content">Login Interface</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Verify redirected to Login Interface instead of showing protected content
    expect(screen.getByTestId('login-content')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders nested children layouts smoothly for authenticated admins', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter initialEntries={['/dashboard/partners']}>
        <Routes>
          <Route 
            path="/dashboard/partners" 
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Administrative Panel Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<div data-testid="login-content">Login Interface</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Verify authenticated user accesses protected content directly
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
  });
});
