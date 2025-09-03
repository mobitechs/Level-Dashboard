import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Download,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Apple,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  AlertCircle,
  X,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  FileText
} from 'lucide-react';
import { getTransactions, getTransactionStats, deleteTransaction } from '../services/api';
import DateRangePicker from './DateRangePicker';
import TransactionDetails from './TransactionDetails';

const TransactionList = ({ 
  onEdit, 
  onBack, 
  showBackButton = true, 
  dateRange, 
  onDateRangeChange, 
  onExport 
}) => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  
  // Dynamic options - will be populated from actual data
  const [dynamicOptions, setDynamicOptions] = useState({
    deviceTypes: [{ value: '', label: 'All Platforms' }],
    statusOptions: [{ value: '', label: 'All Status' }],
    planTypes: [{ value: '', label: 'All Plans' }],
    paymentMethods: [{ value: '', label: 'All Methods' }],
    currencies: [{ value: '', label: 'All Countries' }]
  });
  
  // Use date range from props or default to last 30 days
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    search: '',
    startDate: dateRange?.startDate || thirtyDaysAgo,
    endDate: dateRange?.endDate || today,
    planType: '',
    deviceType: '',
    status: '',
    paymentMethod: '',
    localCurrency: '',
    limit: 20,
    offset: 0,
    sortBy: 'id',
    sortOrder: 'DESC'
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false
  });

  // Available date range for date picker
  const [availableDateRange, setAvailableDateRange] = useState({
    min_date: '2020-01-01',
    max_date: today
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

  // Update filters when dateRange prop changes
  useEffect(() => {
    if (dateRange && (dateRange.startDate !== filters.startDate || dateRange.endDate !== filters.endDate)) {
      setFilters(prev => ({
        ...prev,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        offset: 0
      }));
    }
  }, [dateRange]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log('Fetching transactions with filters:', filters);
      
      const page = Math.floor(filters.offset / filters.limit) + 1;
      const apiFilters = {
        ...filters,
        page,
        limit: filters.limit
      };
      delete apiFilters.offset;
      
      const response = await getTransactions(apiFilters);
      
      if (response.success) {
        setTransactions(response.data);
        setPagination({
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          currentPage: response.pagination.page,
          itemsPerPage: response.pagination.limit,
          hasNext: response.pagination.hasNext,
          hasPrev: response.pagination.hasPrev
        });
        
        extractDynamicOptions(response.data);
        console.log('Transactions loaded:', response.data.length);
      } else {
        showMessage('error', 'Failed to fetch transactions: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showMessage('error', 'Error fetching transactions: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const extractDynamicOptions = (transactionData) => {
    const deviceTypes = [{ value: '', label: 'All Platforms' }];
    const statusOptions = [{ value: '', label: 'All Status' }];
    const planTypes = [{ value: '', label: 'All Plans' }];
    const paymentMethods = [{ value: '', label: 'All Methods' }];
    const currencies = [{ value: '', label: 'All Countries' }];

    const uniqueDeviceTypes = new Set();
    const uniqueStatuses = new Set();
    const uniquePlanTypes = new Set();
    const uniquePaymentMethods = new Set();
    const uniqueCurrencies = new Set();

    transactionData.forEach(transaction => {
      if (transaction.device_type !== null && transaction.device_type !== undefined) {
        uniqueDeviceTypes.add(transaction.device_type.toString());
      }
      if (transaction.status) uniqueStatuses.add(transaction.status);
      if (transaction.plan_type) uniquePlanTypes.add(transaction.plan_type);
      if (transaction.payment_method) uniquePaymentMethods.add(transaction.payment_method);
      if (transaction.local_currency) uniqueCurrencies.add(transaction.local_currency);
    });

    // Always include currently selected values in options
    if (filters.deviceType && filters.deviceType !== '') {
      uniqueDeviceTypes.add(filters.deviceType);
    }
    if (filters.status && filters.status !== '') {
      uniqueStatuses.add(filters.status);
    }
    if (filters.planType && filters.planType !== '') {
      uniquePlanTypes.add(filters.planType);
    }
    if (filters.paymentMethod && filters.paymentMethod !== '') {
      uniquePaymentMethods.add(filters.paymentMethod);
    }
    if (filters.localCurrency && filters.localCurrency !== '') {
      uniqueCurrencies.add(filters.localCurrency);
    }

    ['1', '2', '3'].forEach(type => {
      if (uniqueDeviceTypes.has(type)) {
        const label = type === '1' ? 'Android' : type === '2' ? 'iOS' : 'Web';
        deviceTypes.push({ value: type, label });
      }
    });
    
    uniqueDeviceTypes.forEach(type => {
      if (!['1', '2', '3'].includes(type)) {
        deviceTypes.push({ value: type, label: 'Other' });
      }
    });

    uniqueStatuses.forEach(status => {
      statusOptions.push({ 
        value: status, 
        label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
      });
    });

    uniquePlanTypes.forEach(plan => {
      planTypes.push({ 
        value: plan, 
        label: plan.charAt(0).toUpperCase() + plan.slice(1).replace('_', ' ')
      });
    });

    uniquePaymentMethods.forEach(method => {
      paymentMethods.push({ 
        value: method, 
        label: method.replace('_', ' ')
      });
    });

    uniqueCurrencies.forEach(currency => {
      currencies.push({ value: currency, label: `${currency}` });
    });

    setDynamicOptions({
      deviceTypes,
      statusOptions,
      planTypes,
      paymentMethods,
      currencies
    });
  };

  const fetchStats = async () => {
    try {
      const statsParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'offset' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder') {
          statsParams.append(key, value);
        }
      });

      const response = await getTransactionStats(statsParams.toString() ? `?${statsParams}` : '');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
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
      offset: 0
    }));
  };

  const handleShowAllTransactions = () => {
    const newFilters = {
      ...filters,
      startDate: '',
      endDate: '',
      offset: 0
    };
    setFilters(newFilters);
    
    // Notify parent component about date range change
    if (onDateRangeChange) {
      onDateRangeChange('', '');
    }
  };

  const handleDateRangeApply = (startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate,
      offset: 0
    }));
    
    // Notify parent component about date range change
    if (onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      setDeleting(transactionId);
      const response = await deleteTransaction(transactionId);
      
      if (response.success) {
        fetchTransactions();
        fetchStats();
        showMessage('success', 'Transaction deleted successfully!');
      } else {
        showMessage('error', 'Failed to delete transaction: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showMessage('error', 'Error deleting transaction: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(null);
    }
  };

  const handleViewDetails = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowDetails(true);
  };

  const handleShowDetailsPage = () => {
    setSelectedTransactionId('all');
    setShowDetails(true);
  };

  // NEW: Export functionality
  const handleExport = async () => {
    try {
      console.log('Exporting transaction data...');
      
      if (transactions.length === 0) {
        showMessage('error', 'No data to export');
        return;
      }

      // Create CSV content from current transactions
      const headers = [
        'ID', 'Transaction ID', 'User ID', 'Amount', 'Currency', 
        'Local Amount', 'Local Currency', 'Plan Type', 'Device Type', 
        'Payment Method', 'Status', 'Created At'
      ];

      const csvData = transactions.map(transaction => [
        transaction.id,
        transaction.transaction_id,
        transaction.user_id,
        transaction.amount,
        transaction.currency,
        transaction.local_amount || '',
        transaction.local_currency || '',
        transaction.plan_type,
        getPlatformName(transaction.device_type),
        transaction.payment_method,
        transaction.status,
        new Date(transaction.created_at).toLocaleString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(field => {
            // Handle commas and quotes in data
            const value = String(field || '');
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'Export completed successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      showMessage('error', 'Export failed. Please try again.');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const isValidCurrency = (code) => {
      if (!code || typeof code !== 'string' || code.length !== 3) return false;
      try {
        new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(0);
        return true;
      } catch {
        return false;
      }
    };

    const safeCurrency = isValidCurrency(currency) ? currency : 'USD';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: safeCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);
    } catch (error) {
      return `${safeCurrency} ${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0)}`;
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${Number(num || 0).toFixed(1)}%`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const getPlatformIcon = (deviceType) => {
    switch (parseInt(deviceType)) {
      case 1:
        return <Smartphone size={14} style={{ color: '#10b981' }} />;
      case 2:
        return <Apple size={14} style={{ color: '#64748b' }} />;
      case 3:
        return <Globe size={14} style={{ color: '#3b82f6' }} />;
      default:
        return <Globe size={14} style={{ color: '#94a3b8' }} />;
    }
  };

  const getPlatformName = (deviceType) => {
    switch (parseInt(deviceType)) {
      case 1: return 'Android';
      case 2: return 'iOS';
      case 3: return 'Web';
      default: return 'Other';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'active':
        return <CheckCircle size={12} style={{ color: '#10b981' }} />;
      case 'failed':
      case 'cancelled':
        return <XCircle size={12} style={{ color: '#ef4444' }} />;
      case 'pending':
      case 'billing_issue':
        return <Clock size={12} style={{ color: '#f59e0b' }} />;
      case 'expired':
        return <XCircle size={12} style={{ color: '#6b7280' }} />;
      default:
        return <Clock size={12} style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed': 
      case 'active': return '#10b981';
      case 'failed':
      case 'cancelled': return '#ef4444';
      case 'pending':
      case 'billing_issue': return '#f59e0b';
      case 'expired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getDisplayedRange = () => {
    const startItem = pagination.total > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0;
    const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.total);
    return `${startItem}-${endItem} of ${pagination.total}`;
  };

  if (showDetails) {
    return (
      <div style={{ padding: '16px' }}>
        <TransactionDetails
          transactionId={selectedTransactionId}
          onBack={() => setShowDetails(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: showBackButton ? '16px' : '0',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'auto'
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
          color: message.type === 'error' ? '#dc2626' : '#16a34a'
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

      {/* UPDATED Stats Cards with consistent box design */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '12px', 
          marginBottom: '16px'
        }}>
          {/* Transactions Card - New/Repeat/Failed Design */}
          <div style={{ 
            background: 'white', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            minHeight: '85px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: '600', 
                color: '#64748b'
              }}>
                Transactions
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                {formatNumber(stats.overview.total_transactions)}
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '1px',
              padding: '4px',
              background: '#f8fafc',
              borderRadius: '4px',
              flex: 1
            }}>
              {/* New Transactions */}
              <div style={{ 
                padding: '6px 4px',
                background: 'white',
                borderRadius: '3px'
              }}>
                <div style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: '600', 
                  color: '#3b82f6',
                  marginBottom: '2px',
                  textAlign: 'center'
                }}>
                  New
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  textAlign: 'center'
                }}>
                  {formatNumber(stats.customer_type?.new_transactions || 0)}
                </div>
              </div>
              
              {/* Repeat Transactions */}
              <div style={{ 
                padding: '6px 4px',
                background: 'white',
                borderRadius: '3px'
              }}>
                <div style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: '600', 
                  color: '#8b5cf6',
                  marginBottom: '2px',
                  textAlign: 'center'
                }}>
                  Repeat
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  textAlign: 'center'
                }}>
                  {formatNumber(stats.customer_type?.repeat_transactions || 0)}
                </div>
              </div>
              
              {/* Failed Transactions */}
              <div style={{ 
                padding: '6px 4px',
                background: 'white',
                borderRadius: '3px'
              }}>
                <div style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: '600', 
                  color: '#ef4444',
                  marginBottom: '2px',
                  textAlign: 'center'
                }}>
                  Failed
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  textAlign: 'center'
                }}>
                  {formatNumber(stats.overview.failed_transactions || 0)}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#ef4444', textAlign: 'center', lineHeight: '1' }}>
                  {formatPercentage(stats.overview.failure_rate)}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Card - Box design with Android/iOS/Web */}
          <div style={{ 
            background: 'white', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            minHeight: '85px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  color: '#64748b'
                }}>
                  Revenue
                </div>
                {stats.growth && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {stats.growth.is_revenue_growth_positive ? (
                      <TrendingUp size={12} style={{ color: '#10b981' }} />
                    ) : (
                      <TrendingDown size={12} style={{ color: '#ef4444' }} />
                    )}
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '600',
                      color: stats.growth.is_revenue_growth_positive ? '#10b981' : '#ef4444'
                    }}>
                      ({Math.abs(stats.growth.revenue_growth_30d)}%)
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                {formatCurrency(stats.overview.total_revenue)}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '1px',
              padding: '4px',
              background: '#f8fafc',
              borderRadius: '4px',
              flex: 1
            }}>
              {stats.by_platform.map((platform, index) => {
                const colors = [
                  { color: '#10b981' }, // Android - Green
                  { color: '#64748b' }, // iOS - Gray  
                  { color: '#3b82f6' }  // Web/Other - Blue
                ];
                return (
                  <div key={platform.device_type} style={{ 
                    padding: '6px 4px',
                    background: 'white',
                    borderRadius: '3px'
                  }}>
                    <div style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '600', 
                      color: colors[index]?.color || '#6b7280', 
                      marginBottom: '2px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px'
                    }}>
                      {getPlatformIcon(platform.device_type)}
                      {platform.platform_name}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '700', 
                      color: '#1f2937',
                      textAlign: 'center',
                      marginBottom: '1px'
                    }}>
                      {formatCurrency(platform.revenue)}
                    </div>
                    {/* FIXED: Use platform.count instead of platform.transaction_count */}
                    <div style={{ 
                      fontSize: '0.55rem', 
                      color: '#6b7280',
                      textAlign: 'center',
                      lineHeight: '1'
                    }}>
                      {formatNumber(platform.count || 0)} txns
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Type Breakdown - Box design like transactions */}
          {stats.plan_breakdown && (
            <div style={{ 
              background: 'white', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              minHeight: '85px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Package size={12} style={{ color: '#f59e0b' }} />
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '600', 
                    color: '#64748b'
                  }}>
                    Plan Types
                  </span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                  {formatNumber(
                    (stats.plan_breakdown.monthly_count || 0) +
                    (stats.plan_breakdown.half_yearly_count || 0) +
                    (stats.plan_breakdown.yearly_count || 0) +
                    (stats.plan_breakdown.astro_report_count || 0)
                  )}
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                gap: '1px', 
                padding: '4px',
                background: '#f8fafc',
                borderRadius: '4px',
                flex: 1
              }}>
                {/* Monthly */}
                <div style={{ 
                  padding: '4px 2px',
                  background: 'white',
                  borderRadius: '3px'
                }}>
                  <div style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600', 
                    color: '#3b82f6', 
                    marginBottom: '2px',
                    textAlign: 'center'
                  }}>
                    Monthly
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '700', 
                    color: '#1f2937', 
                    marginBottom: '1px',
                    textAlign: 'center'
                  }}>
                    {formatNumber(stats.plan_breakdown.monthly_count || 0)}
                  </div>
                  {/* FIXED: Calculate total unique users */}
                  <div style={{ fontSize: '0.55rem', color: '#6b7280', textAlign: 'center', lineHeight: '1' }}>
                    {formatNumber(
                      (stats.plan_breakdown.monthly_user_breakdown?.unique_new_users || 0) +
                      (stats.plan_breakdown.monthly_user_breakdown?.unique_repeat_users || 0)
                    )} users
                  </div>
                </div>

                {/* Half Yearly */}
                <div style={{ 
                  padding: '4px 2px',
                  background: 'white',
                  borderRadius: '3px'
                }}>
                  <div style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600', 
                    color: '#8b5cf6', 
                    marginBottom: '2px',
                    textAlign: 'center'
                  }}>
                    Half Yearly
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '700', 
                    color: '#1f2937', 
                    marginBottom: '1px',
                    textAlign: 'center'
                  }}>
                    {formatNumber(stats.plan_breakdown.half_yearly_count || 0)}
                  </div>
                  {/* FIXED: Calculate total unique users */}
                  <div style={{ fontSize: '0.55rem', color: '#6b7280', textAlign: 'center', lineHeight: '1' }}>
                    {formatNumber(
                      (stats.plan_breakdown.half_yearly_user_breakdown?.unique_new_users || 0) +
                      (stats.plan_breakdown.half_yearly_user_breakdown?.unique_repeat_users || 0)
                    )} users
                  </div>
                </div>

                {/* Yearly */}
                <div style={{ 
                  padding: '4px 2px',
                  background: 'white',
                  borderRadius: '3px'
                }}>
                  <div style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600', 
                    color: '#10b981', 
                    marginBottom: '2px',
                    textAlign: 'center'
                  }}>
                    Yearly
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '700', 
                    color: '#1f2937', 
                    marginBottom: '1px',
                    textAlign: 'center'
                  }}>
                    {formatNumber(stats.plan_breakdown.yearly_count || 0)}
                  </div>
                  {/* FIXED: Calculate total unique users */}
                  <div style={{ fontSize: '0.55rem', color: '#6b7280', textAlign: 'center', lineHeight: '1' }}>
                    {formatNumber(
                      (stats.plan_breakdown.yearly_user_breakdown?.unique_new_users || 0) +
                      (stats.plan_breakdown.yearly_user_breakdown?.unique_repeat_users || 0)
                    )} users
                  </div>
                </div>

                {/* Astro Report */}
                <div style={{ 
                  padding: '4px 2px',
                  background: 'white',
                  borderRadius: '3px'
                }}>
                  <div style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600', 
                    color: '#f59e0b', 
                    marginBottom: '2px',
                    textAlign: 'center'
                  }}>
                    Astro Report
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '700', 
                    color: '#1f2937', 
                    marginBottom: '1px',
                    textAlign: 'center'
                  }}>
                    {formatNumber(stats.plan_breakdown.astro_report_count || 0)}
                  </div>
                  {/* FIXED: Calculate total unique users */}
                  <div style={{ fontSize: '0.55rem', color: '#6b7280', textAlign: 'center', lineHeight: '1' }}>
                    {formatNumber(
                      (stats.plan_breakdown.astro_report_user_breakdown?.unique_new_users || 0) +
                      (stats.plan_breakdown.astro_report_user_breakdown?.unique_repeat_users || 0)
                    )} users
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Section - Compact */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '12px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '180px', flex: '1 1 180px' }}>
            <Search size={14} style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#64748b' 
            }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}
            />
          </div>

          {/* Payment Method */}
          <select
            value={filters.paymentMethod}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.8rem',
              minWidth: '90px'
            }}
          >
            {dynamicOptions.paymentMethods.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Currency */}
          <select
            value={filters.localCurrency}
            onChange={(e) => handleFilterChange('localCurrency', e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.8rem',
              minWidth: '90px'
            }}
          >
            {dynamicOptions.currencies.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={filters.deviceType}
            onChange={(e) => handleFilterChange('deviceType', e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.8rem',
              minWidth: '90px'
            }}
          >
            {dynamicOptions.deviceTypes.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.8rem',
              minWidth: '90px'
            }}
          >
            {dynamicOptions.statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Plan Type Filter */}
          <select
            value={filters.planType}
            onChange={(e) => handleFilterChange('planType', e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.8rem',
              minWidth: '90px'
            }}
          >
            {dynamicOptions.planTypes.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Export Button */}
          {(onExport || handleExport) && (
            <button 
              onClick={onExport || handleExport}
              className="btn-primary"
              style={{ 
                fontSize: '0.75rem', 
                padding: '5px 10px', 
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={12} />
              Export
            </button>
          )}

          {/* Clear Filters */}
          <button 
            onClick={() => setFilters(prev => ({ 
              ...prev,
              search: '', 
              deviceType: '',
              status: '',
              planType: '',
              paymentMethod: '',
              localCurrency: '',
              offset: 0 
            }))}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '5px 8px', whiteSpace: 'nowrap' }}
          >
            Clear
          </button>

          {/* Show All */}
          <button 
            onClick={handleShowAllTransactions}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '5px 10px', whiteSpace: 'nowrap' }}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Date Range Info */}
      {(filters.startDate || filters.endDate) && (
        <div style={{ 
          padding: '6px 12px', 
          fontSize: '0.8rem', 
          color: '#3b82f6', 
          background: '#eff6ff',
          borderRadius: '4px',
          marginBottom: '12px'
        }}>
          {filters.startDate && filters.endDate ? 
            `Showing transactions from ${new Date(filters.startDate).toLocaleDateString()} to ${new Date(filters.endDate).toLocaleDateString()}` :
            filters.startDate === today && filters.endDate === today ?
            `Showing today's transactions (${new Date().toLocaleDateString()})` :
            `Filtered date range selected`
          }
        </div>
      )}

      {/* Data Table Container */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '6px', 
        overflow: 'hidden',
        overflowX: 'auto'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 140px 120px 100px 100px 80px 100px 80px 80px 100px 100px',
          gap: '10px',
          padding: '12px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.8rem',
          fontWeight: '600',
          color: '#475569',
          minWidth: '1100px'
        }}>
          <div>ID</div>
          <div>Transaction ID</div>
          <div>User</div>
          <div>Amount</div>
          <div>Plan</div>
          <div>Platform</div>
          <div>Payment</div>
          <div>Status</div>
          <div>Country</div>
          <div>Created At</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Table Content */}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '150px',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div className="loading-spinner"></div>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Loading transactions...</span>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div 
                key={transaction.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 140px 120px 100px 100px 80px 100px 80px 80px 100px 100px',
                  gap: '10px',
                  padding: '10px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '0.8rem',
                  alignItems: 'center',
                  minWidth: '1100px'
                }}
              >
                <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                  #{transaction.id}
                </div>
                
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.7rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {transaction.transaction_id}
                </div>
                
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.7rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {transaction.user_id}
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', color: '#059669' }}>
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </div>
                  {transaction.local_amount && transaction.local_currency !== transaction.currency && (
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {formatCurrency(transaction.local_amount, transaction.local_currency)}
                    </div>
                  )}
                </div>
                
                <div>
                  <span style={{ 
                    background: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '1px 4px', 
                    borderRadius: '3px', 
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.plan_type}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {getPlatformIcon(transaction.device_type)}
                  <span style={{ fontSize: '0.7rem' }}>{getPlatformName(transaction.device_type)}</span>
                </div>
                
                <div style={{ fontSize: '0.7rem' }}>
                  {transaction.payment_method?.replace('_', ' ')}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {getStatusIcon(transaction.status)}
                  <span style={{ 
                    color: getStatusColor(transaction.status), 
                    fontWeight: '600',
                    fontSize: '0.7rem',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Globe size={9} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>
                    {transaction.local_currency || transaction.currency}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                  {formatDate(transaction.created_at)}
                </div>
                
                <div className="text-center">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <button 
                      onClick={() => handleViewDetails(transaction.id)}
                      className="btn-icon"
                      style={{ padding: '3px' }}
                      title="View Details"
                    >
                      <Eye size={11} />
                    </button>
                    <button 
                      onClick={() => onEdit && onEdit(transaction.id)}
                      className="btn-icon"
                      style={{ padding: '3px' }}
                      title="Edit Transaction"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button 
                      onClick={() => handleDelete(transaction.id)}
                      className="btn-icon"
                      style={{ padding: '3px', color: '#ef4444' }}
                      disabled={deleting === transaction.id}
                      title="Delete Transaction"
                    >
                      {deleting === transaction.id ? (
                        <div className="loading-spinner" style={{ width: '11px', height: '11px' }}></div>
                      ) : (
                        <Trash2 size={11} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374155', margin: '0 0 6px 0' }}>
                No Transactions Found
              </h3>
              <p style={{ color: '#64748b', margin: '0', fontSize: '0.8rem' }}>
                {Object.values(filters).some(v => v && v !== '') 
                  ? 'No transactions match your current filters. Try clearing filters or adjusting your search criteria.'
                  : 'No transaction data available.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Compact Pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '8px 12px',
          borderTop: '1px solid #e2e8f0',
          background: 'white',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Rows per page:</span>
            <select
              value={filters.limit}
              onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
              style={{
                padding: '4px 6px',
                border: '1px solid #e2e8f0',
                borderRadius: '3px',
                fontSize: '0.8rem',
                background: 'white'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {getDisplayedRange()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              style={{
                padding: '4px',
                border: 'none',
                background: 'transparent',
                cursor: !pagination.hasPrev ? 'not-allowed' : 'pointer',
                opacity: !pagination.hasPrev ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronLeft size={14} color="#64748b" />
            </button>
            
            <button 
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              style={{
                padding: '4px',
                border: 'none',
                background: 'transparent',
                cursor: !pagination.hasNext ? 'not-allowed' : 'pointer',
                opacity: !pagination.hasNext ? 0.5 : 1,
                display: 'flex',
                alignItems: 'centers'
              }}
            >
              <ChevronRight size={14} color="#64748b" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;