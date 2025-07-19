import React from 'react';
import { 
  FireIcon, 
  ClockIcon, 
  StarIcon, 
  ChartBarIcon,
  FunnelIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const FilterBar = ({ activeFilter, onFilterChange, className = '' }) => {
  const { theme } = useTheme();

  const filters = [
    { 
      id: 'all', 
      label: 'All', 
      icon: FunnelIcon,
      description: 'All public confessions'
    },
    { 
      id: 'trending', 
      label: 'Trending', 
      icon: FireIcon,
      description: 'Popular confessions right now'
    },
    { 
      id: 'recent', 
      label: 'Recent', 
      icon: ClockIcon,
      description: 'Latest confessions'
    },
    { 
      id: 'top', 
      label: 'Top', 
      icon: StarIcon,
      description: 'Most upvoted'
    },
    { 
      id: 'engaging', 
      label: 'Engaging', 
      icon: ChartBarIcon,
      description: 'Most replies and interactions'
    },
    { 
      id: 'liked', 
      label: 'Liked', 
      icon: HeartIcon,
      description: 'Your liked confessions'
    }
  ];

  return (
    <div className={`filter-bar ${className}`}>
      {filters.map(filter => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`filter-button ${isActive ? 'active' : ''}`}
            title={filter.description}
          >
            <Icon className="w-4 h-4" />
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FilterBar;