import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const FloatingActionButton = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`fab hover-glow ${className}`}
      aria-label="Create new confession"
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
};

export default FloatingActionButton;