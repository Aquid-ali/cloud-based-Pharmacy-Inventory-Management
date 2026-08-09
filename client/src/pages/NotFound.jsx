import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
