import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const HOME_BY_ROLE = {
  Admin: '/dashboard',
  Customer: '/shop',
};

/**
 * Guards a route tree behind authentication and (optionally) role.
 * `allowedRoles` also determines which login page an unauthenticated
 * visitor is sent to, since Admin and Customer sign in at different URLs.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();
  const loginPath = allowedRoles?.includes('Admin') && !allowedRoles?.includes('Customer')
    ? '/admin/login'
    : '/login';

  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
