import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (requiredRole && profile) {
    if (requiredRole === 'seller' && profile.role !== 'seller' && profile.role !== 'both') {
      return <Navigate to="/" replace />;
    }
    if (requiredRole === 'buyer' && profile.role !== 'buyer' && profile.role !== 'both') {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
