import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">✓</span>
          <span className="brand-text">TaskMaster 🚀</span>
        </Link>

        <nav className="navbar-nav">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/tasks"
                end
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Tasks
              </NavLink>
              <NavLink
                to="/tasks/new"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                + New Task
              </NavLink>
              <div className="nav-user-info">
                <span className="user-greeting" title={user?.email}>
                  Hi, {user?.name || 'User'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  aria-label="Log out"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
