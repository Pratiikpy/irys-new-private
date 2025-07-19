import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-600 border-t-cyan-400"></div>
    </div>
  );
};

export const LoadingCard = () => (
  <div className="confession-card animate-pulse">
    <div className="space-y-4">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-4">
          <div className="h-8 w-16 bg-gray-700 rounded"></div>
          <div className="h-8 w-16 bg-gray-700 rounded"></div>
        </div>
        <div className="h-6 w-20 bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

export const LoadingFeed = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <LoadingCard key={index} />
    ))}
  </div>
);

export default LoadingSpinner;