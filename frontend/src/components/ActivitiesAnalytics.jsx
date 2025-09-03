import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Download,
  ChevronLeft,
  ChevronRight,
  Activity,
  Play,
  Users,
  Repeat,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  Tag
} from 'lucide-react';
import { getActivities, getActivityStats, deleteActivity, getActivityTypes, getActivitiesDateRange } from '../services/api';
import DateRangePicker from './DateRangePicker';

const ActivitiesAnalytics = ({ onEdit, onBack, showBackButton = true }) => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [datePickerLoading, setDatePickerLoading] = useState(false);
  const [availableDateRange, setAvailableDateRange] = useState({ min_date: '', max_date: '' });
  
  // Dynamic options from data
  const [dynamicOptions, setDynamicOptions] = useState({
    activityTypes: [{ value: '', label: 'All Activity Types' }],
    categories: [{ value: '', label: 'All Categories' }]
  });

  // Default to last 30 days
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({
    startDate: thirtyDaysAgo,
    endDate: today
  });
  
  const [filters, setFilters] = useState({
    search: '',
    activityType: '',
    category: '',
    sortBy: 'total_plays',
    sortOrder: 'DESC',
    limit: 20,
    offset: 0
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    initializeDateRange();
    fetchActivityTypes();
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [filters, dateRange]);

  const initializeDateRange = async () => {
    try {
      const response = await getActivitiesDateRange();
      if (response.success) {
        setAvailableDateRange(response.data);
        
        // Set default date range to last 30 days within available range
        const maxDate = response.data.max_date;
        const minDate = response.data.min_date;
        const defaultEnd = maxDate;
        const defaultStart = new Date(new Date(maxDate) - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const finalStart = defaultStart < minDate ? minDate : defaultStart;
        
        setDateRange({
          startDate: finalStart,
          endDate: defaultEnd
        });
      }
    } catch (error) {
      console.error('Error fetching date range:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchActivityTypes = async () => {
    try {
      const response = await getActivityTypes();
      if (response.success) {
        const types = [{ value: '', label: 'All Activity Types' }];
        response.data.forEach(type => {
          types.push({ value: type.name, label: type.name });
        });
        
        setDynamicOptions(prev => ({
          ...prev,
          activityTypes: types
        }));
      }
    } catch (error) {
      console.error('Error fetching activity types:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      console.log('Fetching activities with filters:', filters, dateRange);
      
      const page = Math.floor(filters.offset / filters.limit) + 1;
      const apiFilters = {
        ...filters,
        page,
        limit: filters.limit,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      delete apiFilters.offset;
      
      const response = await getActivities(apiFilters);
      
      if (response.success) {
        setActivities(response.data);
        setPagination({
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          currentPage: response.pagination.page,
          itemsPerPage: response.pagination.limit,
          hasNext: response.pagination.hasNext,
          hasPrev: response.pagination.hasPrev
        });
        
        extractDynamicOptions(response.data);
        console.log('Activities loaded:', response.data.length);
      } else {
        showMessage('error', 'Failed to fetch activities: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      showMessage('error', 'Error fetching activities: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const extractDynamicOptions = (activityData) => {
    const categories = [{ value: '', label: 'All Categories' }];
    const uniqueCategories = new Set();

    activityData.forEach(activity => {
      if (activity.category) uniqueCategories.add(activity.category);
    });

    if (filters.category && filters.category !== '') {
      uniqueCategories.add(filters.category);
    }

    uniqueCategories.forEach(category => {
      categories.push({ value: category, label: category });
    });

    setDynamicOptions(prev => ({
      ...prev,
      categories
    }));
  };

  const fetchStats = async () => {
    try {
      const statsParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'offset' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder') {
          statsParams.append(key, value);
        }
      });
      
      statsParams.append('startDate', dateRange.startDate);
      statsParams.append('endDate', dateRange.endDate);

      const response = await getActivityStats(statsParams.toString() ? `?${statsParams}` : '');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    }
  };

  const handleDateRangeApply = async (startDate, endDate) => {
    setDatePickerLoading(true);
    setDateRange({ startDate, endDate });
    setFilters(prev => ({ ...prev, offset: 0 }));
    setTimeout(() => setDatePickerLoading(false), 500);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0
    }));
  };

  const handleSort = (field) => {
    if (filters.sortBy === field) {
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: 'DESC'
      }));
    }
  };

  const getSortIcon = (field) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return filters.sortOrder === 'ASC' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const handlePageChange = (newPage) => {
    const newOffset = (newPage - 1) * filters.limit;
    setFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  const handleRowsPerPageChange = (newLimit) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      offset: 0
    }));
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      setDeleting(activityId);
      const response = await deleteActivity(activityId);
      
      if (response.success) {
        fetchActivities();
        fetchStats();
        showMessage('success', 'Activity deleted successfully!');
      } else {
        showMessage('error', 'Failed to delete activity: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      showMessage('error', 'Error deleting activity: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(null);
    }
  };

  const handleQuickSort = (sortType) => {
    const sortConfigs = {
      'top_plays': { sortBy: 'total_plays', sortOrder: 'DESC' },
      'low_plays': { sortBy: 'total_plays', sortOrder: 'ASC' },
      'most_repeat': { sortBy: 'repeat_rate', sortOrder: 'DESC' },
      'least_repeat': { sortBy: 'repeat_rate', sortOrder: 'ASC' },
      'top_users': { sortBy: 'unique_users', sortOrder: 'DESC' },
      'newest': { sortBy: 'id', sortOrder: 'DESC' }
    };

    if (sortConfigs[sortType]) {
      setFilters(prev => ({
        ...prev,
        ...sortConfigs[sortType],
        offset: 0
      }));
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${Number(num || 0).toFixed(1)}%`;
  };

  const getDisplayedRange = () => {
    const startItem = pagination.total > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0;
    const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.total);
    return `${startItem}-${endItem} of ${pagination.total}`;
  };

  const exportData = () => {
    const csv = [
      ['ID', 'Name', 'Type', 'Category', 'Total Plays', 'Repeat Plays', 'Total Users', 'Unique Users', 'Repeat Rate %'],
      ...activities.map(activity => [
        activity.id,
        activity.name,
        activity.activity_type_name,
        activity.category || 'N/A',
        activity.total_plays || 0,
        activity.repeat_plays || 0,
        activity.total_users || 0,
        activity.unique_users || 0,
        activity.repeat_rate || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-analytics-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const getSelectedActivityTypeLabel = () => {
    if (!filters.activityType) return '';
    const selectedType = dynamicOptions.activityTypes.find(type => type.value === filters.activityType);
    return selectedType ? ` (${selectedType.label})` : ` (${filters.activityType})`;
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      padding: showBackButton ? '16px' : '0'
    }}>
      {/* Message Display */}
      {message.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '6px',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#dc2626' : '#16a34a',
          flexShrink: 0
        }}>
          {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{message.text}</span>
          <button 
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ 
              marginLeft: 'auto', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}





      {/* Stats Cards */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px', 
          marginBottom: '20px',
          flexShrink: 0
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Activity size={20} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>
                Total Activities
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
              {formatNumber(stats.overview?.total_activities || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Total Activities{getSelectedActivityTypeLabel()}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Play size={20} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>
                Total Plays
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              {formatNumber(stats.overview?.total_plays || 0)}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Users size={20} style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>
                Unique Users
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              {formatNumber(stats.overview?.unique_users || 0)}
            </div>
          </div>
        </div>
      )}



      {/* Filters Section */}
      <div style={{ 
        padding: '16px',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '16px',
        flexShrink: 0
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 150px 150px 100px 140px 100px',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#64748b' 
            }} />
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <select
            value={filters.activityType}
            onChange={(e) => handleFilterChange('activityType', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            {dynamicOptions.activityTypes.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            {dynamicOptions.categories.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button 
            onClick={() => setFilters(prev => ({ 
              ...prev,
              search: '', 
              activityType: '',
              category: '',
              offset: 0 
            }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>

          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onApply={handleDateRangeApply}
            availableDateRange={availableDateRange}
            loading={datePickerLoading}
          />
          
          <button
            onClick={exportData}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Quick Sort Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'top_plays', label: 'Top Played', color: '#10b981' },
            { key: 'low_plays', label: 'Low Played', color: '#ef4444' },
            { key: 'most_repeat', label: 'Most Repeat', color: '#8b5cf6' },
            { key: 'least_repeat', label: 'Least Repeat', color: '#f59e0b' },
            { key: 'top_users', label: 'Top Users', color: '#06b6d4' },
            { key: 'newest', label: 'Newest', color: '#64748b' }
          ].map(sort => (
            <button
              key={sort.key}
              onClick={() => handleQuickSort(sort.key)}
              style={{
                padding: '6px 12px',
                border: `1px solid ${sort.color}20`,
                borderRadius: '6px',
                background: (filters.sortBy === sort.key.split('_')[1] || (sort.key === 'newest' && filters.sortBy === 'id')) ? sort.color : 'white',
                color: (filters.sortBy === sort.key.split('_')[1] || (sort.key === 'newest' && filters.sortBy === 'id')) ? 'white' : sort.color,
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Table */}
      <div style={{ 
        flex: 1,
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '70px 2fr 140px 140px 110px 110px 110px 110px 90px 100px',
          gap: '16px',
          padding: '16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#475569',
          flexShrink: 0,
          alignItems: 'center'
        }}>
          <button onClick={() => handleSort('id')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'left',
            justifyContent: 'flex-start'
          }}>
            ID {getSortIcon('id')}
          </button>
          <button onClick={() => handleSort('name')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'left',
            justifyContent: 'flex-start'
          }}>
            Name {getSortIcon('name')}
          </button>
          <button onClick={() => handleSort('activity_type_name')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'left',
            justifyContent: 'flex-start'
          }}>
            Type {getSortIcon('activity_type_name')}
          </button>
          <div style={{ textAlign: 'left' }}>Category</div>
          <button onClick={() => handleSort('total_plays')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'right',
            justifyContent: 'flex-end'
          }}>
            Total Plays {getSortIcon('total_plays')}
          </button>
          <button onClick={() => handleSort('repeat_plays')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'right',
            justifyContent: 'flex-end'
          }}>
            Repeat Plays {getSortIcon('repeat_plays')}
          </button>
          <button onClick={() => handleSort('total_users')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'right',
            justifyContent: 'flex-end'
          }}>
            Total Users {getSortIcon('total_users')}
          </button>
          <button onClick={() => handleSort('unique_users')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'right',
            justifyContent: 'flex-end'
          }}>
            Unique Users {getSortIcon('unique_users')}
          </button>
          <button onClick={() => handleSort('repeat_rate')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600', 
            color: '#475569',
            textAlign: 'right',
            justifyContent: 'flex-end'
          }}>
            Repeat Rate {getSortIcon('repeat_rate')}
          </button>
          <div style={{ textAlign: 'center' }}>Actions</div>
        </div>

        {/* Table Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          minHeight: 0
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '200px',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ color: '#64748b' }}>Loading activities...</span>
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <div 
                key={activity.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 2fr 140px 140px 110px 110px 110px 110px 90px 100px',
                  gap: '16px',
                  padding: '16px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '0.875rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: '600', color: '#3b82f6', textAlign: 'left' }}>
                  #{activity.id}
                </div>
                
                <div style={{ 
                  fontWeight: '500', 
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left'
                }}>
                  {activity.name}
                </div>
                
                <div style={{ textAlign: 'left' }}>
                  <span style={{ 
                    background: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    {activity.activity_type_name || 'Unknown'}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left'
                }}>
                  {activity.category || 'N/A'}
                </div>
                
                <div style={{ fontWeight: '600', color: '#059669', textAlign: 'right' }}>
                  {formatNumber(activity.total_plays || 0)}
                </div>
                
                <div style={{ fontWeight: '500', color: '#7c3aed', textAlign: 'right' }}>
                  {formatNumber(activity.repeat_plays || 0)}
                </div>
                
                <div style={{ fontWeight: '500', color: '#dc2626', textAlign: 'right' }}>
                  {formatNumber(activity.total_users || 0)}
                </div>
                
                <div style={{ fontWeight: '500', color: '#ea580c', textAlign: 'right' }}>
                  {formatNumber(activity.unique_users || 0)}
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    background: parseFloat(activity.repeat_rate || 0) >= 50 ? '#dcfce7' : 
                               parseFloat(activity.repeat_rate || 0) >= 25 ? '#fef3c7' : '#fecaca',
                    color: parseFloat(activity.repeat_rate || 0) >= 50 ? '#166534' : 
                           parseFloat(activity.repeat_rate || 0) >= 25 ? '#92400e' : '#991b1b',
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {formatPercentage(activity.repeat_rate || 0)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <button 
                    onClick={() => onEdit && onEdit(activity.id)}
                    style={{
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#3b82f6',
                      borderRadius: '4px'
                    }}
                    title="Edit Activity"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(activity.id)}
                    style={{
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      borderRadius: '4px'
                    }}
                    disabled={deleting === activity.id}
                    title="Delete Activity"
                  >
                    {deleting === activity.id ? (
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #f3f4f6',
                        borderTop: '2px solid #ef4444',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <Activity size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374155', margin: '0 0 8px 0' }}>
                No Activities Found
              </h3>
              <p style={{ color: '#64748b', margin: '0' }}>
                No activities match your current filters and date range. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          background: 'white',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {getDisplayedRange()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                style={{
                  padding: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: !pagination.hasPrev ? 'not-allowed' : 'pointer',
                  opacity: !pagination.hasPrev ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={16} color="#64748b" />
              </button>
              
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                style={{
                  padding: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: !pagination.hasNext ? 'not-allowed' : 'pointer',
                  opacity: !pagination.hasNext ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Rows per page:</span>
              <select
                value={filters.limit}
                onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ActivitiesAnalytics;