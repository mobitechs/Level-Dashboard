import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const SimpleDatePicker = ({ 
  startDate, 
  endDate, 
  onApply, 
  availableDateRange,
  label = "Select Date Range"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowYearSelector(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDisplayDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDateClick = (dateStr) => {
    if (selectingStart) {
      setTempStartDate(dateStr);
      setTempEndDate('');
      setSelectingStart(false);
    } else {
      if (dateStr >= tempStartDate) {
        setTempEndDate(dateStr);
        setSelectingStart(true);
        // Auto apply when both dates are selected
        setTimeout(() => {
          onApply(tempStartDate, dateStr);
          setIsOpen(false);
        }, 150);
      } else {
        // If end date is before start date, make it the new start date
        setTempStartDate(dateStr);
        setTempEndDate('');
      }
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(dateStr);
    }
    
    return days;
  };

  const getPreviewRange = () => {
    if (!tempStartDate || selectingStart || !hoveredDate) return [];
    if (hoveredDate < tempStartDate) return [];
    
    const start = new Date(tempStartDate);
    const end = new Date(hoveredDate);
    const range = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      range.push(d.toISOString().split('T')[0]);
    }
    
    return range;
  };

  const previewRange = getPreviewRange();

  const isDateInRange = (dateStr) => {
    if (!tempStartDate || !tempEndDate) return false;
    return dateStr >= tempStartDate && dateStr <= tempEndDate;
  };

  const isDateInPreview = (dateStr) => {
    return previewRange.includes(dateStr);
  };

  const isDateSelected = (dateStr) => {
    return dateStr === tempStartDate || dateStr === tempEndDate;
  };

  const isDateDisabled = (dateStr) => {
    return dateStr < availableDateRange.min_date || dateStr > availableDateRange.max_date;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const navigateYear = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(prev.getFullYear() + direction);
      return newMonth;
    });
  };

  const handleYearSelect = (year) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
    setShowYearSelector(false);
  };

  const getAvailableYears = () => {
    const minYear = new Date(availableDateRange.min_date).getFullYear();
    const maxYear = new Date(availableDateRange.max_date).getFullYear();
    const years = [];
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year);
    }
    return years;
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentYear = currentMonth.getFullYear();
  const availableYears = getAvailableYears();

  return (
    <div ref={pickerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          border: '2px solid #e5e7eb',
          borderRadius: '10px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.875rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderColor: isOpen ? '#3b82f6' : '#e5e7eb',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: isOpen ? 'translateY(-1px)' : 'translateY(0)'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        <Calendar size={18} color="#6b7280" style={{ 
          transition: 'color 0.2s ease',
          color: isOpen ? '#3b82f6' : '#6b7280'
        }} />
        <div style={{ flex: 1 }}>
          {tempStartDate && tempEndDate ? (
            <div>
              <div style={{ 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '2px'
              }}>
                {formatDisplayDate(tempStartDate)} - {formatDisplayDate(tempEndDate)}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981'
                }} />
                {Math.ceil((new Date(tempEndDate) - new Date(tempStartDate)) / (1000 * 60 * 60 * 24)) + 1} days selected
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280' }}>{label}</div>
          )}
        </div>
        <ChevronDown 
          size={16} 
          color="#6b7280"
          style={{ 
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <>
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
            onClick={() => {
              setIsOpen(false);
              setShowYearSelector(false);
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 9999,
              padding: '16px',
              minWidth: '280px',
              animation: 'slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <style>
              {`
                @keyframes slideDown {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                
                @keyframes pulse {
                  0%, 100% {
                    transform: scale(1);
                  }
                  50% {
                    transform: scale(1.05);
                  }
                }
              `}
            </style>

            {/* Calendar Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              {/* Previous Month */}
              <button
                onClick={() => navigateMonth(-1)}
                style={{
                  padding: '10px',
                  border: 'none',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e2e8f0';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Month/Year Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setShowYearSelector(!showYearSelector)}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
                >
                  {monthYear}
                </h3>
                
                {/* Year Navigation */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => navigateYear(-1)}
                    style={{
                      padding: '6px',
                      border: 'none',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#475569',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e2e8f0';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f1f5f9';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => navigateYear(1)}
                    style={{
                      padding: '6px',
                      border: 'none',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#475569',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e2e8f0';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f1f5f9';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
              
              {/* Next Month */}
              <button
                onClick={() => navigateMonth(1)}
                style={{
                  padding: '10px',
                  border: 'none',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e2e8f0';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Year Selector Dropdown */}
            {showYearSelector && (
              <div style={{
                position: 'absolute',
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                zIndex: 10000,
                maxHeight: '200px',
                overflowY: 'auto',
                minWidth: '120px',
                animation: 'slideDown 0.15s ease'
              }}>
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      background: year === currentYear ? '#eff6ff' : 'white',
                      color: year === currentYear ? '#1e40af' : '#374155',
                      fontSize: '0.875rem',
                      fontWeight: year === currentYear ? '600' : '500',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      borderRadius: year === availableYears[0] ? '12px 12px 0 0' : year === availableYears[availableYears.length - 1] ? '0 0 12px 12px' : '0'
                    }}
                    onMouseEnter={(e) => {
                      if (year !== currentYear) {
                        e.target.style.background = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (year !== currentYear) {
                        e.target.style.background = 'white';
                      }
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}

            {/* Days of Week */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginBottom: '8px'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#6b7280'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px'
            }}>
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} style={{ padding: '12px' }} />;
                }

                const isSelected = isDateSelected(day);
                const isInRange = isDateInRange(day);
                const isInPreview = isDateInPreview(day);
                const isDisabled = isDateDisabled(day);

                return (
                  <button
                    key={day}
                    onClick={() => !isDisabled && handleDateClick(day)}
                    disabled={isDisabled}
                    onMouseEnter={() => {
                      if (!isDisabled) {
                        setHoveredDate(day);
                      }
                    }}
                    onMouseLeave={() => setHoveredDate(null)}
                    style={{
                      padding: '8px 4px',
                      border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                      borderRadius: '6px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? '700' : '500',
                      background: isSelected 
                        ? '#3b82f6' 
                        : isInRange 
                          ? '#dbeafe' 
                          : isInPreview 
                            ? '#fef3c7' 
                            : 'transparent',
                      color: isSelected 
                        ? 'white' 
                        : isInRange 
                          ? '#1e40af' 
                          : isInPreview 
                            ? '#d97706' 
                            : isDisabled 
                              ? '#d1d5db' 
                              : '#374155',
                      opacity: isDisabled ? 0.4 : 1,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isSelected 
                        ? '0 6px 20px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)' 
                        : hoveredDate === day && !isSelected && !isDisabled
                          ? '0 2px 8px rgba(0, 0, 0, 0.15)'
                          : 'none'
                    }}
                  >
                    {new Date(day).getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SimpleDatePicker;