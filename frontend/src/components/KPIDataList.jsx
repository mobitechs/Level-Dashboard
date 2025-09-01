import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Smartphone,
  Apple,
  Globe,
  ArrowUpDown,
  Download,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { 
  getKPIDataList, 
  deleteKPIData, 
  getCategories, 
  getAvailableDateRange 
} from '../services/api';

const KPIDataList = ({ onAdd, onEdit, initialFilters = {}, onBack, showBackButton = true }) => {
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [categories, setCategories] = useState([]);
  const [availableDateRange, setAvailableDateRange] = useState({ min_date: '', max_date: '' });
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Initialize filters with any passed initialFilters - NO DEFAULT DATES
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    kpiId: '',
    categoryId: '',
    limit: 20,
    offset: 0,
    ...initialFilters // Apply any initial filters passed from parent
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Apply initial filters after data is loaded
    if (Object.keys(initialFilters).length > 0 && categories.length > 0) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters,
        offset: 0
      }));
    }
  }, [categories, initialFilters]);

  useEffect(() => {
    fetchKPIData();
  }, [filters]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const loadInitialData = async () => {
    try {
      const [categoriesResponse, dateRangeResponse] = await Promise.all([
        getCategories(),
        getAvailableDateRange()
      ]);
      
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }
      
      if (dateRangeResponse.success) {
        setAvailableDateRange(dateRangeResponse.data);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      showMessage('error', 'Error loading initial data: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching KPI data with filters:', filters);
      
      // Clean the filters - only send non-empty values
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          cleanFilters[key] = filters[key];
        }
      });
      
      console.log('📤 Clean filters being sent:', cleanFilters);
      const response = await getKPIDataList(cleanFilters);
      
      if (response.success) {
        setKpiData(response.data);
        setPagination(response.pagination);
        console.log(`✅ Loaded ${response.data.length} KPI data records`);
      } else {
        console.error('❌ Failed to fetch KPI data:', response);
        showMessage('error', 'Failed to fetch KPI data: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error fetching KPI data:', err);
      showMessage('error', 'Error fetching KPI data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    if (field === 'categoryId') {
      setFilters(prev => ({
        ...prev,
        [field]: value,
        kpiId: '', // Reset KPI selection when category changes
        offset: 0
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: value,
        offset: 0 // Reset to first page when filtering
      }));
    }
  };

  const handleDateRangeSelect = (days) => {
    const endDate = availableDateRange.max_date || new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date(endDate) - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate < availableDateRange.min_date ? availableDateRange.min_date : startDate,
      endDate,
      offset: 0
    }));
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
      offset: 0 // Reset to first page when changing limit
    }));
  };

  const handleDelete = async (id, kpiName, date) => {
    if (!window.confirm(`Are you sure you want to delete the KPI data for "${kpiName}" on ${formatDate(date)}?`)) {
      return;
    }
    
    try {
      setDeleting(id);
      console.log('🗑️ Deleting KPI data ID:', id);
      const response = await deleteKPIData(id);
      
      if (response.success) {
        await fetchKPIData(); // Refresh the list
        showMessage('success', 'KPI data deleted successfully!');
      } else {
        console.error('❌ Delete failed:', response);
        showMessage('error', 'Failed to delete KPI data: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error deleting KPI data:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to delete KPI data. ';
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      showMessage('error', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  // FIXED: Handle edit functionality properly
  const handleEdit = (item) => {
    console.log('🔧 Editing KPI data item:', item);
    // Pass the item's ID to the edit function
    if (onEdit && typeof onEdit === 'function') {
      onEdit(item.id); // Pass just the ID for editing
    } else {
      console.error('onEdit function not provided or not a function');
      showMessage('error', 'Edit functionality not properly configured');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Create export filters without pagination
      const exportFilters = {
        ...filters,
        limit: 1000, // Export up to 1000 records
        offset: 0
      };
      
      // Clean the export filters too
      const cleanExportFilters = {};
      Object.keys(exportFilters).forEach(key => {
        if (exportFilters[key] !== '' && exportFilters[key] !== null && exportFilters[key] !== undefined) {
          cleanExportFilters[key] = exportFilters[key];
        }
      });
      
      // Fetch all data based on current filters
      const response = await getKPIDataList(cleanExportFilters);
      
      if (response.success && response.data.length > 0) {
        // Create CSV content
        const headers = [
          'ID',
          'KPI Name',
          'Category',
          'Date',
          'Android Value',
          'iOS Value',
          'Net Value',
          'Source',
          'Unit',
          'Notes',
          'Created At'
        ];
        
        const csvContent = [
          headers.join(','),
          ...response.data.map(item => [
            `"${item.id || ''}"`,
            `"${item.kpi_name || ''}"`,
            `"${item.category_name || ''}"`,
            `"${formatDate(item.date_value)}"`,
            `"${formatValue(item.android_value, item.unit)}"`,
            `"${formatValue(item.ios_value, item.unit)}"`,
            `"${formatValue(item.net_value, item.unit)}"`,
            `"${item.data_source || ''}"`,
            `"${item.unit || ''}"`,
            `"${item.notes || ''}"`,
            `"${new Date(item.created_at).toLocaleDateString()}"`
          ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with current date and applied filters
        const today = new Date().toISOString().split('T')[0];
        let filename = `kpi-data-${today}`;
        
        if (filters.search) filename += `-search-${filters.search.replace(/[^a-zA-Z0-9]/g, '')}`;
        if (filters.categoryId) {
          const category = categories.find(cat => cat.id == filters.categoryId);
          if (category) filename += `-${category.name.replace(/[^a-zA-Z0-9]/g, '')}`;
        }
        if (filters.startDate) filename += `-from-${filters.startDate}`;
        if (filters.endDate) filename += `-to-${filters.endDate}`;
        
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Exported ${response.data.length} records to ${filename}.csv`);
        showMessage('success', `Successfully exported ${response.data.length} records to ${filename}.csv`);
      } else {
        showMessage('error', 'No data available to export with current filters.');
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      showMessage('error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '—';
    
    switch (unit) {
      case '$':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case '%':
        return `${parseFloat(value).toFixed(1)}%`;
      case 'installs':
      case 'users':
      case 'visits':
      case 'crashes':
        return new Intl.NumberFormat('en-US').format(value);
      case 'ratio':
        return parseFloat(value).toFixed(1);
      default:
        return typeof value === 'number' ? value.toLocaleString() : value;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const getFilteredKPIs = () => {
    if (!filters.categoryId) {
      // If no category selected, return all KPIs
      const allKPIs = [];
      categories.forEach(category => {
        if (category.kpis) {
          category.kpis.forEach(kpi => {
            allKPIs.push({
              id: kpi.id,
              name: kpi.name,
              category_name: category.name
            });
          });
        }
      });
      return allKPIs;
    } else {
      // Return only KPIs from selected category
      const selectedCategory = categories.find(cat => cat.id == filters.categoryId);
      return selectedCategory?.kpis?.map(kpi => ({
        id: kpi.id,
        name: kpi.name,
        category_name: selectedCategory.name
      })) || [];
    }
  };

  const getDisplayedRange = () => {
    const startItem = pagination.total > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0;
    const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.total);
    return `${startItem}-${endItem} of ${pagination.total}`;
  };

  // Check if we have initial filters applied (showing filtered view)
  const hasInitialFilters = Object.keys(initialFilters).length > 0;

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      padding: showBackButton ? '16px' : '0'
    }}>
      {/* Back button for filtered views - only show if showBackButton is true */}
      {showBackButton && hasInitialFilters && onBack && (
        <div style={{ paddingBottom: '16px', flexShrink: 0 }}>
          <button 
            onClick={onBack}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

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
          flexShrink: 0,
          margin: showBackButton ? '0 0 16px 0' : '16px 16px 16px 16px'
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

      {/* Filters Section */}
      <div style={{ 
        paddingBottom: '16px', 
        flexShrink: 0,
        padding: showBackButton ? '0 0 16px 0' : '16px 16px 16px 16px'
      }}>
        {/* Main Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 150px 150px 80px',
          gap: '12px',
          padding: '16px',
          background: 'white',
          border: '1px solid var(--secondary-200)',
          borderRadius: '8px'
        }}>
          {/* Search - ENHANCED: Now searches by ID too */}
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
              placeholder="Search KPIs, categories, sources, or ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid var(--secondary-200)',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--secondary-200)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          {/* KPI Filter */}
          <select
            value={filters.kpiId}
            onChange={(e) => handleFilterChange('kpiId', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--secondary-200)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All KPIs</option>
            {getFilteredKPIs().map(kpi => (
              <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button 
            onClick={() => setFilters(prev => ({ 
              ...prev,
              search: '', 
              startDate: '', 
              endDate: '', 
              kpiId: '',
              categoryId: '',
              offset: 0 
            }))}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
          >
            Clear
          </button>
        </div>

        {/* Quick Date Range Buttons and Export */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px', 
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '8px' }}>
              Quick date filters:
            </span>
            <button 
              onClick={() => handleDateRangeSelect(7)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Last 7 days
            </button>
            <button 
              onClick={() => handleDateRangeSelect(30)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Last 30 days
            </button>
            <button 
              onClick={() => handleDateRangeSelect(90)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Last 90 days
            </button>
            <input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              min={availableDateRange.min_date}
              max={availableDateRange.max_date}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={{
                padding: '4px 8px',
                border: '1px solid var(--secondary-200)',
                borderRadius: '6px',
                fontSize: '0.75rem'
              }}
            />
            <input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              min={availableDateRange.min_date}
              max={availableDateRange.max_date}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={{
                padding: '4px 8px',
                border: '1px solid var(--secondary-200)',
                borderRadius: '6px',
                fontSize: '0.75rem'
              }}
            />
          </div>

          {/* Export Button */}
          <button 
            onClick={handleExport}
            disabled={exporting || loading}
            className="btn-primary"
            style={{ 
              fontSize: '0.8rem', 
              padding: '6px 12px',
              opacity: exporting || loading ? 0.6 : 1,
              cursor: exporting || loading ? 'not-allowed' : 'pointer'
            }}
          >
            {exporting ? (
              <>
                <div className="loading-spinner" style={{ width: '12px', height: '12px' }}></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Data Table Container */}
      <div style={{ 
        flex: 1,
        background: 'white', 
        border: '1px solid var(--secondary-200)', 
        borderRadius: '8px', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        margin: showBackButton ? '0' : '0 16px 16px 16px'
      }}>
        {/* Table Header - ENHANCED: Added ID column */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 120px 100px 100px 100px 120px 100px',
          gap: '12px',
          padding: '16px',
          background: 'var(--secondary-50)',
          borderBottom: '1px solid var(--secondary-200)',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--secondary-700)',
          flexShrink: 0
        }}>
          <div>ID</div>
          <div>KPI Details</div>
          <div>Date</div>
          <div className="text-center">Android</div>
          <div className="text-center">iOS</div>
          <div className="text-center">Net</div>
          <div>Source</div>
          <div className="text-center">Actions</div>
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
              <div className="loading-spinner"></div>
              <span style={{ color: '#64748b' }}>Loading KPI data...</span>
            </div>
          ) : kpiData.length > 0 ? (
            kpiData.map((item) => (
              <div 
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px 100px 100px 100px 120px 100px',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: '1px solid var(--secondary-100)',
                  fontSize: '0.875rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                  #{item.id}
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{item.kpi_name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.category_name}</div>
                </div>
                
                <div style={{ color: '#374155', fontWeight: '500' }}>
                  {formatDate(item.date_value)}
                </div>
                
                <div className="text-center">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Smartphone size={12} style={{ color: '#10b981' }} />
                    <span style={{ fontWeight: '600' }}>
                      {formatValue(item.android_value, item.unit)}
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Apple size={12} style={{ color: '#64748b' }} />
                    <span style={{ fontWeight: '600' }}>
                      {formatValue(item.ios_value, item.unit)}
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Globe size={12} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: '600' }}>
                      {formatValue(item.net_value, item.unit)}
                    </span>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {item.data_source || '—'}
                </div>
                
                <div className="text-center">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <button 
                      onClick={() => handleEdit(item)}
                      className="btn-icon"
                      style={{ padding: '6px' }}
                      title="Edit KPI data"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.kpi_name, item.date_value)}
                      className="btn-icon"
                      style={{ padding: '6px', color: '#ef4444' }}
                      disabled={deleting === item.id}
                      title="Delete KPI data"
                    >
                      {deleting === item.id ? (
                        <div className="loading-spinner" style={{ width: '14px', height: '14px' }}></div>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
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
              <BarChart3 size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374155', margin: '0 0 8px 0' }}>
                No KPI Data Found
              </h3>
              <p style={{ color: '#64748b', margin: '0' }}>
                {filters.startDate || filters.endDate || filters.search || filters.categoryId || filters.kpiId 
                  ? 'No records match your current filters. Try clearing filters or adjusting your search criteria.'
                  : 'No KPI data available.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination - Always visible */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '12px 16px',
          borderTop: '1px solid var(--secondary-200)',
          background: 'white',
          gap: '16px',
          flexShrink: 0
        }}>
          {/* Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Rows per page:</span>
            <select
              value={filters.limit}
              onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
              style={{
                padding: '6px 8px',
                border: '1px solid var(--secondary-200)',
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

          {/* Display range */}
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {getDisplayedRange()}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              style={{
                padding: '6px',
                border: 'none',
                background: 'transparent',
                cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage <= 1 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronLeft size={16} color="#64748b" />
            </button>
            
            <button 
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= Math.max(1, pagination.totalPages)}
              style={{
                padding: '6px',
                border: 'none',
                background: 'transparent',
                cursor: pagination.currentPage >= Math.max(1, pagination.totalPages) ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage >= Math.max(1, pagination.totalPages) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronRight size={16} color="#64748b" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDataList;