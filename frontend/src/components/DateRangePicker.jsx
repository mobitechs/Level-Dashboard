import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onApply, 
  availableDateRange,
  loading = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Helper function to format date consistently
  const formatDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // Helper function to calculate date ranges properly
  const calculateDateRange = (days, endDate) => {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    
    const startDateString = formatDateString(start);
    const endDateString = formatDateString(end);
    
    const adjustedStart = startDateString < availableDateRange.min_date ? 
      availableDateRange.min_date : startDateString;
    
    return { start: adjustedStart, end: endDateString };
  };

  const quickFilters = [
    {
      label: 'Last 7 days',
      key: '7days',
      getDates: () => calculateDateRange(7, availableDateRange.max_date)
    },
    {
      label: 'Last 30 days',
      key: '30days',
      getDates: () => calculateDateRange(30, availableDateRange.max_date)
    },
    {
      label: 'Last 90 days',
      key: '90days',
      getDates: () => calculateDateRange(90, availableDateRange.max_date)
    },
    {
      label: 'All time',
      key: 'all',
      getDates: () => ({
        start: availableDateRange.min_date,
        end: availableDateRange.max_date
      })
    }
  ];

  const handleQuickFilter = (filter) => {
    const dates = filter.getDates();
    setTempStartDate(dates.start);
    setTempEndDate(dates.end);
    setSelectedQuickFilter(filter.key);
  };

  const handleApply = () => {
    if (!tempStartDate || !tempEndDate) {
      alert('Please select both start and end dates.');
      return;
    }

    if (tempStartDate > tempEndDate) {
      alert('Start date cannot be after end date.');
      return;
    }

    if (tempStartDate < availableDateRange.min_date || tempStartDate > availableDateRange.max_date) {
      alert(`Start date must be between ${formatDateForDisplay(availableDateRange.min_date)} and ${formatDateForDisplay(availableDateRange.max_date)}.`);
      return;
    }

    if (tempEndDate < availableDateRange.min_date || tempEndDate > availableDateRange.max_date) {
      alert(`End date must be between ${formatDateForDisplay(availableDateRange.min_date)} and ${formatDateForDisplay(availableDateRange.max_date)}.`);
      return;
    }

    onApply(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setSelectedQuickFilter('');
    setIsOpen(false);
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysDifference = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Date picker clicked, current isOpen:', isOpen); // Debug log
    setIsOpen(!isOpen);
  };

  const isApplyDisabled = !tempStartDate || !tempEndDate || tempStartDate > tempEndDate;

  return (
    <div 
      ref={pickerRef}
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        userSelect: 'none'
      }}
    >
      {/* Trigger Button */}
      <div 
        onClick={handleTriggerClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.875rem',
          minWidth: '240px',
          boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
          borderColor: isOpen ? '#3b82f6' : '#d1d5db',
          transition: 'all 0.2s ease'
        }}
      >
        <Calendar size={16} color="#6b7280" />
        <div style={{ flex: 1 }}>
          {startDate && endDate ? (
            <div>
              <div style={{ fontWeight: '500', color: '#374155', lineHeight: '1.2' }}>
                {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.2' }}>
                {getDaysDifference(startDate, endDate)} days selected
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280' }}>Select date range</div>
          )}
        </div>
        {loading ? (
          <div 
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid #f3f4f6',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        ) : (
          <ChevronDown 
            size={16} 
            color="#6b7280"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        )}
      </div>

      {/* Popup */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'transparent',
              zIndex: 9998
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popup Content */}
          <div 
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              minWidth: '320px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374155',
                margin: 0
              }}>
                Select Date Range
              </h3>
            </div>

            {/* Quick Filters */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280',
                margin: '0 0 8px 0'
              }}>
                Quick Select
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                {quickFilters.map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => handleQuickFilter(filter)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      background: selectedQuickFilter === filter.key ? '#3b82f6' : 'white',
                      color: selectedQuickFilter === filter.key ? 'white' : '#374155',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Inputs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={tempStartDate || ''}
                  min={availableDateRange.min_date}
                  max={availableDateRange.max_date}
                  onChange={(e) => {
                    setTempStartDate(e.target.value);
                    setSelectedQuickFilter('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={tempEndDate || ''}
                  min={tempStartDate || availableDateRange.min_date}
                  max={availableDateRange.max_date}
                  onChange={(e) => {
                    setTempEndDate(e.target.value);
                    setSelectedQuickFilter('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button 
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#374155',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                disabled={isApplyDisabled}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: isApplyDisabled ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  fontSize: '0.875rem',
                  cursor: isApplyDisabled ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: isApplyDisabled ? 0.6 : 1
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add keyframes for spin animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DateRangePicker;