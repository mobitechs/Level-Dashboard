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
  Package
} from 'lucide-react';
import { getTransactions, getTransactionStats, deleteTransaction } from '../services/api';

const TransactionList = ({ onEdit, onBack, showBackButton = true }) => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Dynamic options - will be populated from actual data
  const [dynamicOptions, setDynamicOptions] = useState({
    deviceTypes: [{ value: '', label: 'All Platforms' }],
    statusOptions: [{ value: '', label: 'All Status' }],
    planTypes: [{ value: '', label: 'All Plans' }],
    paymentMethods: [{ value: '', label: 'All Methods' }],
    currencies: [{ value: '', label: 'All Countries' }]
  });
  
  // Default to last 30 days instead of just today
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    search: '',
    startDate: thirtyDaysAgo,
    endDate: today,
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

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

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
    setFilters(prev => ({
      ...prev,
      startDate: '',
      endDate: '',
      offset: 0
    }));
  };

  const handleTodayTransactions = () => {
    setFilters(prev => ({
      ...prev,
      startDate: today,
      endDate: today,
      offset: 0
    }));
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

      {/* Enhanced Stats Cards */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '20px', 
          paddingBottom: '20px',
          flexShrink: 0
        }}>
          {/* Combined Transactions Card */}
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '8px',
                letterSpacing: '0.025em'
              }}>
                Transactions
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#1f2937', lineHeight: '1' }}>
                {formatNumber(stats.overview.total_transactions)}
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#ef4444', 
                fontWeight: '600',
                background: '#fef2f2',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Failed
                <span style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>
                  {formatNumber(stats.overview.failed_transactions)} ({formatPercentage(stats.overview.failure_rate)})
                </span>
              </div>
            </div>

            <div style={{ 
              borderTop: '2px dashed #e2e8f0', 
              paddingTop: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              flex: 1
            }}>
              <div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#3b82f6',
                  marginBottom: '8px',
                  background: '#eff6ff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  New
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px', marginTop: '8px' }}>
                  {formatNumber(stats.customer_type?.new_transactions || 0)}
                </div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#8b5cf6',
                  marginBottom: '8px',
                  background: '#faf5ff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  Repeat
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px', marginTop: '8px' }}>
                  {formatNumber(stats.customer_type?.repeat_transactions || 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {formatNumber(stats.customer_type?.unique_repeat_users || 0)} users
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Revenue Card with Platform Breakdown */}
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '8px',
                letterSpacing: '0.025em'
              }}>
                Revenue
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#1f2937', lineHeight: '1' }}>
                  {formatCurrency(stats.overview.total_revenue)}
                </div>
                {stats.growth && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {stats.growth.is_revenue_growth_positive ? (
                      <TrendingUp size={16} style={{ color: '#10b981' }} />
                    ) : (
                      <TrendingDown size={16} style={{ color: '#ef4444' }} />
                    )}
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: stats.growth.is_revenue_growth_positive ? '#10b981' : '#ef4444'
                    }}>
                      ({Math.abs(stats.growth.revenue_growth_30d)}% vs last 30d)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              borderTop: '2px dashed #e2e8f0', 
              paddingTop: '16px',
              flex: 1
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '16px' }}>
                {stats.by_platform.map((platform, index) => {
                  const colors = [
                    { bg: '#f0fdf4', text: '#10b981' }, // Android - green
                    { bg: '#f8fafc', text: '#64748b' }, // iOS - gray  
                    { bg: '#fef3c7', text: '#f59e0b' }  // Other - yellow
                  ];
                  return (
                    <div key={platform.device_type}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '4px',
                        marginBottom: '12px',
                        background: colors[index].bg,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        color: colors[index].text
                      }}>
                        {getPlatformIcon(platform.device_type)}
                        {platform.platform_name}
                      </div>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        color: '#1f2937',
                        textAlign: 'center',
                        marginBottom: '4px'
                      }}>
                        {formatCurrency(platform.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ 
                borderTop: '1px solid #f1f5f9', 
                paddingTop: '12px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Transactions
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {stats.by_platform.map((platform) => (
                    <div key={platform.device_type} style={{ textAlign: 'center' }}>
                      {formatNumber(platform.count)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Plan Type Breakdown - Reduced spacing */}
          {stats.plan_breakdown && (
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              gridColumn: 'span 2',
              minHeight: '280px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px' 
              }}>
                <Package size={16} style={{ color: '#f59e0b' }} />
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#64748b',
                  letterSpacing: '0.025em'
                }}>
                  Plan Types
                </span>
              </div>
              
              {/* Three columns layout - reduced gaps further */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '6px', 
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                {/* Monthly */}
                <div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#3b82f6', 
                    marginBottom: '6px',
                    background: '#eff6ff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    Monthly
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '6px', marginTop: '8px' }}>
                    {formatNumber(stats.plan_breakdown.monthly_count || 0)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2px' }}>
                    {formatNumber(stats.plan_breakdown.monthly_user_breakdown?.repeat_transactions || 0)} repeat
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatNumber(stats.plan_breakdown.monthly_user_breakdown?.unique_repeat_users || 0)} unique
                  </div>
                </div>

                {/* Half Yearly */}
                <div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#8b5cf6', 
                    marginBottom: '6px',
                    background: '#faf5ff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    Half Yearly
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '6px', marginTop: '8px' }}>
                    {formatNumber(stats.plan_breakdown.half_yearly_count || 0)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2px' }}>
                    {formatNumber(stats.plan_breakdown.half_yearly_user_breakdown?.repeat_transactions || 0)} repeat
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatNumber(stats.plan_breakdown.half_yearly_user_breakdown?.unique_repeat_users || 0)} unique
                  </div>
                </div>

                {/* Yearly */}
                <div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#10b981', 
                    marginBottom: '6px',
                    background: '#f0fdf4',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    Yearly
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '6px', marginTop: '8px' }}>
                    {formatNumber(stats.plan_breakdown.yearly_count || 0)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2px' }}>
                    {formatNumber(stats.plan_breakdown.yearly_user_breakdown?.repeat_transactions || 0)} repeat
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatNumber(stats.plan_breakdown.yearly_user_breakdown?.unique_repeat_users || 0)} unique
                  </div>
                </div>
              </div>

              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                borderTop: '1px solid #e2e8f0', 
                paddingTop: '12px', 
                marginTop: '16px',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                Total Revenue: {formatCurrency(stats.plan_breakdown.total_revenue || 0)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div style={{ 
        paddingBottom: '16px', 
        flexShrink: 0
      }}>
        {/* Main Filters Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '250px 120px 120px 120px 120px 120px 100px 100px',
          gap: '12px',
          padding: '16px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }}>
          {/* Search Box */}
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
              placeholder="Search transactions..."
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

          {/* Payment Method */}
          <select
            value={filters.paymentMethod}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
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
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
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
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
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
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
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
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            {dynamicOptions.planTypes.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

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
            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
          >
            Clear
          </button>

          {/* Show All */}
          <button 
            onClick={handleShowAllTransactions}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Show All
          </button>
        </div>

        {/* Date Range Filters with Quick Action Buttons */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px', 
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
            
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />

            {/* Quick Action Buttons */}
            <button 
              onClick={handleTodayTransactions}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            >
              Today's Transactions
            </button>
            <button 
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: today,
                offset: 0 
              }))}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                startDate: thirtyDaysAgo,
                endDate: today,
                offset: 0 
              }))}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            >
              Last 30 Days
            </button>
          </div>

          <button 
            onClick={fetchTransactions}
            className="btn-primary"
            disabled={loading}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Info */}
      {(filters.startDate || filters.endDate) && (
        <div style={{ 
          padding: '8px 16px', 
          fontSize: '0.875rem', 
          color: '#3b82f6', 
          background: '#eff6ff',
          borderRadius: '6px',
          marginBottom: '16px',
          flexShrink: 0
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
          gridTemplateColumns: '60px 140px 120px 100px 100px 80px 100px 80px 80px 100px 80px',
          gap: '12px',
          padding: '16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#475569',
          flexShrink: 0
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
              <span style={{ color: '#64748b' }}>Loading transactions...</span>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div 
                key={transaction.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 140px 120px 100px 100px 80px 100px 80px 80px 100px 80px',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '0.875rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                  #{transaction.id}
                </div>
                
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {transaction.transaction_id}
                </div>
                
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
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
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatCurrency(transaction.local_amount, transaction.local_currency)}
                    </div>
                  )}
                </div>
                
                <div>
                  <span style={{ 
                    background: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.plan_type}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {getPlatformIcon(transaction.device_type)}
                  <span style={{ fontSize: '0.75rem' }}>{getPlatformName(transaction.device_type)}</span>
                </div>
                
                <div style={{ fontSize: '0.75rem' }}>
                  {transaction.payment_method?.replace('_', ' ')}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {getStatusIcon(transaction.status)}
                  <span style={{ 
                    color: getStatusColor(transaction.status), 
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={10} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                    {transaction.local_currency || transaction.currency}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {formatDate(transaction.created_at)}
                </div>
                
                <div className="text-center">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <button 
                      onClick={() => onEdit && onEdit(transaction.id)}
                      className="btn-icon"
                      style={{ padding: '4px' }}
                      title="Edit Transaction"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDelete(transaction.id)}
                      className="btn-icon"
                      style={{ padding: '4px', color: '#ef4444' }}
                      disabled={deleting === transaction.id}
                      title="Delete Transaction"
                    >
                      {deleting === transaction.id ? (
                        <div className="loading-spinner" style={{ width: '12px', height: '12px' }}></div>
                      ) : (
                        <Trash2 size={12} />
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
              <CreditCard size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374155', margin: '0 0 8px 0' }}>
                No Transactions Found
              </h3>
              <p style={{ color: '#64748b', margin: '0' }}>
                {Object.values(filters).some(v => v && v !== '') 
                  ? 'No transactions match your current filters. Try clearing filters or adjusting your search criteria.'
                  : 'No transaction data available.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          background: 'white',
          gap: '16px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Rows per page:</span>
            <select
              value={filters.limit}
              onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
              style={{
                padding: '6px 8px',
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

          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {getDisplayedRange()}
          </div>

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
                alignItems: 'centers'
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

export default TransactionList;