import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FireIcon,
  ClockIcon,
  HashtagIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { confessionAPI, analyticsAPI } from '../../utils/api';
import { debounce } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfessionCard from '../confession/ConfessionCard';

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    mood: '',
    tags: [],
    author: '',
    date_from: '',
    date_to: '',
    sort_by: 'timestamp',
    order: 'desc'
  });
  const [loading, setLoading] = useState(false);
  const [trendingTags, setTrendingTags] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const moods = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'angry', label: 'Angry', emoji: '😡' },
    { value: 'excited', label: 'Excited', emoji: '🎉' },
    { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
    { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' }
  ];

  const sortOptions = [
    { value: 'timestamp', label: 'Most Recent' },
    { value: 'upvotes', label: 'Most Liked' },
    { value: 'reply_count', label: 'Most Replies' },
    { value: 'view_count', label: 'Most Viewed' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchTrendingTags();
      loadRecentSearches();
    }
  }, [isOpen]);

  const fetchTrendingTags = async () => {
    try {
      const data = await analyticsAPI.getTrendingTags(10);
      setTrendingTags(data.tags || []);
    } catch (error) {
      console.error('Failed to fetch trending tags:', error);
    }
  };

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);
  };

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const newRecent = [query, ...recent.filter(s => s !== query)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    setRecentSearches(newRecent);
  };

  const debouncedSearch = debounce(async (query, filters) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchParams = {
        query: query.trim(),
        ...filters
      };

      const data = await confessionAPI.search(searchParams);
      setSearchResults(data.confessions || []);
      saveRecentSearch(query);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query, searchFilters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...searchFilters, [key]: value };
    setSearchFilters(newFilters);
    
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery, newFilters);
    }
  };

  const handleTagSearch = (tag) => {
    setSearchQuery(`#${tag}`);
    debouncedSearch(`#${tag}`, searchFilters);
  };

  const handleRecentSearch = (query) => {
    setSearchQuery(query);
    debouncedSearch(query, searchFilters);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFilters({
      mood: '',
      tags: [],
      author: '',
      date_from: '',
      date_to: '',
      sort_by: 'timestamp',
      order: 'desc'
    });
  };

  const handleClose = () => {
    clearSearch();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      className="h-[80vh] flex flex-col"
    >
      <div className="flex-shrink-0 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search confessions..."
            icon={MagnifyingGlassIcon}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
          >
            Filters {showAdvancedFilters ? '▲' : '▼'}
          </button>

          {searchFilters.mood && (
            <span className="px-3 py-1 bg-cyan-600 text-white rounded-lg text-sm flex items-center gap-1">
              {moods.find(m => m.value === searchFilters.mood)?.emoji} {searchFilters.mood}
              <button
                onClick={() => handleFilterChange('mood', '')}
                className="ml-1 text-cyan-200 hover:text-white"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchFilters.author && (
            <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1">
              @{searchFilters.author}
              <button
                onClick={() => handleFilterChange('author', '')}
                className="ml-1 text-purple-200 hover:text-white"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
            {/* Mood Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mood</label>
              <select
                value={searchFilters.mood}
                onChange={(e) => handleFilterChange('mood', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Moods</option>
                {moods.map(mood => (
                  <option key={mood.value} value={mood.value}>
                    {mood.emoji} {mood.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={searchFilters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Author</label>
              <Input
                value={searchFilters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                placeholder="Username..."
                icon={UserIcon}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 mt-4 overflow-y-auto custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Found {searchResults.length} results
            </div>
            {searchResults.map(confession => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                compact={true}
                onView={() => handleClose()}
              />
            ))}
          </div>
        )}

        {!loading && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-8">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No confessions found for "{searchQuery}"</p>
            <p className="text-sm text-gray-500 mt-2">Try different keywords or filters</p>
          </div>
        )}

        {!loading && !searchQuery && (
          <div className="space-y-6">
            {/* Trending Tags */}
            {trendingTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FireIcon className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Trending Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map(tag => (
                    <button
                      key={tag.tag}
                      onClick={() => handleTagSearch(tag.tag)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-1"
                    >
                      <HashtagIcon className="w-3 h-3" />
                      {tag.tag}
                      <span className="text-xs text-gray-400">({tag.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold">Recent Searches</h3>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearch(search)}
                      className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg text-sm"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SearchModal;