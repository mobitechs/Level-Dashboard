import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Smartphone, 
  DollarSign, 
  AlertTriangle,
  Download,
  Activity,
  Target,
  Menu,
  X,
  Apple,
  ChevronDown,
  ChevronRight,
  Home,
  Zap,
  Plus,
  Globe,
  Database,
  List,
  ArrowRight,
  CreditCard,
  BarChart,
  MessageCircle,
  Play,
  Eye,
  Calendar
} from 'lucide-react';
import { getDashboardData, getAvailableDateRange } from '../services/api';
import DateRangePicker from './DateRangePicker';
import KPIDataForm from './KPIDataForm';
import KPIDataList from './KPIDataList';
import AddKPIData from './AddKPIData';
import KPIComparison from './KPIComparison';
import KPIBulkImport from './KPIBulkImport';
import TransactionList from './TransactionList';
import ActivitiesAnalytics from './ActivitiesAnalytics';
import WhatsAppMessaging from './WhatsAppMessaging';
import TransactionDetails from './TransactionDetails'; // Add this import
import '../styles/dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openCategory, setOpenCategory] = useState(null);
  const [openStats, setOpenStats] = useState(null);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [editingValueId, setEditingValueId] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [availableDateRange, setAvailableDateRange] = useState({ min_date: '', max_date: '' });
  const [loading, setLoading] = useState(true);
  const [datePickerLoading, setDatePickerLoading] = useState(false);
  const [error, setError] = useState(null);

  // Transaction-specific date range state
  const [transactionDateRange, setTransactionDateRange] = useState({ startDate: '', endDate: '' });

  const categoryIcons = {
    'Acquisition': Users,
    'Activation': Zap,
    'Retention': Activity,
    'Revenue': DollarSign,
    'Tech Metrics': AlertTriangle,
    'Customer Support': Users,
    'Design': BarChart3
  };

  useEffect(() => {
    initializeDashboard();
  }, []);

  console.log('Dashboard State:', { selectedView, editingValueId, selectedKPI });

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const dateRangeResponse = await getAvailableDateRange();
      if (dateRangeResponse.success) {
        setAvailableDateRange(dateRangeResponse.data);
        
        const endDate = dateRangeResponse.data.max_date;
        const startDate = new Date(new Date(endDate) - 29 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        
        const defaultRange = { 
          startDate: startDate < dateRangeResponse.data.min_date ? dateRangeResponse.data.min_date : startDate, 
          endDate 
        };
        
        setDateRange(defaultRange);
        setTransactionDateRange(defaultRange);
        await fetchDashboardData(defaultRange.startDate, defaultRange.endDate);
      }
    } catch (err) {
      console.error('Error initializing dashboard:', err);
      setError('Failed to initialize dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (startDate, endDate) => {
    try {
      setDatePickerLoading(true);
      setError(null);
      
      const response = await getDashboardData(startDate, endDate);
      
      if (response.success && response.data && response.data.length > 0) {
        setDashboardData(response.data);
      } else {
        setDashboardData([]);
      }
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to fetch dashboard data');
      setDashboardData([]);
    } finally {
      setDatePickerLoading(false);
    }
  };

  const handleDateRangeApply = async (startDate, endDate) => {
    setDateRange({ startDate, endDate });
    await fetchDashboardData(startDate, endDate);
  };

  const handleTransactionDateRangeApply = async (startDate, endDate) => {
    setTransactionDateRange({ startDate, endDate });
  };

  const handleTransactionDateRangeChange = (startDate, endDate) => {
    setTransactionDateRange({ startDate, endDate });
  };

  const handleDataRefresh = () => {
    if (selectedView === 'dashboard') {
      fetchDashboardData(dateRange.startDate, dateRange.endDate);
    }
  };

  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const toggleStats = () => {
    setOpenStats(openStats === 'stats' ? null : 'stats');
  };

  const handleKPIClick = (kpi, category) => {
    setSelectedKPI({
      kpi: kpi,
      category: category
    });
    setSelectedView('kpi-data-list');
  };

  const handleBackToDashboard = () => {
    setSelectedView('dashboard');
    setSelectedKPI(null);
    setEditingValueId(null);
  };

  const handleTransactionsMenu = () => {
    console.log('💳 Dashboard: Navigating to transactions view');
    setSelectedView('transactions');
    setSelectedKPI(null);
    setEditingValueId(null);
  };

  const handleActivitiesMenu = () => {
    console.log('🎯 Dashboard: Navigating to activities analytics');
    setSelectedView('activities-analytics');
    setSelectedKPI(null);
    setEditingValueId(null);
  };

  const handleWhatsAppMenu = () => {
    console.log('📱 Dashboard: Navigating to WhatsApp messaging');
    setSelectedView('whatsapp-messaging');
    setSelectedKPI(null);
    setEditingValueId(null);
  };

  const handleAddDataDirect = () => {
    console.log('🚀 Dashboard: Navigating directly to add KPI data form');
    setEditingValueId(null);
    setSelectedKPI(null);
    setSelectedView('add-data');
  };

  const handleAddData = () => {
    console.log('📝 Dashboard: Navigating to add KPI data form from list');
    setEditingValueId(null);
    setSelectedView('add-data');
  };

  const handleEditData = (valueId) => {
    console.log('📝 Dashboard: Navigating to edit KPI data form with ID:', valueId);
    setEditingValueId(valueId);
    setSelectedView('edit-data');
  };

  const handleImportData = () => {
    console.log('📤 Dashboard: Navigating to import KPI data');
    setSelectedView('import-data');
  };

  const handleImportBack = () => {
    console.log('📤 Dashboard: Navigating back from import');
    setSelectedView('add-data');
  };

  const handleFormBack = () => {
    console.log('📝 Dashboard: Navigating back from form');
    setEditingValueId(null);
    
    if (selectedKPI) {
      setSelectedView('kpi-data-list');
    } else {
      setSelectedView('kpi-data-list');
    }
  };

  const handleDataManagementMenu = () => {
    setSelectedView('data-management');
    setSelectedKPI(null);
    setEditingValueId(null);
  };

  // UPDATED: Handle details button click for transactions - now shows the details page
  const handleTransactionDetails = () => {
    console.log('🔍 Dashboard: Opening transaction segment analysis');
    setSelectedView('transaction-details');
  };

  // NEW: Export functionality for transactions
  const handleExportTransactions = async () => {
    try {
      console.log('📥 Exporting transaction data...');
      
      // You can either call the export API or use the current filtered data
      const exportParams = new URLSearchParams();
      exportParams.append('startDate', transactionDateRange.startDate);
      exportParams.append('endDate', transactionDateRange.endDate);
      exportParams.append('export', 'true');
      
      // Option 1: Direct API call for export
      const response = await fetch(`/api/transactions?${exportParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          downloadCSV(data.data, 'transactions');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // NEW: CSV download utility function
  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Convert data to CSV format
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle commas and quotes in data
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return 'N/A';
    
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

  const hasValidValue = (value) => {
    return value !== null && value !== undefined && value !== 'N/A';
  };

  const KPICard = ({ kpi }) => {
    const { currentValues } = kpi;
    const mockGrowth = (Math.random() * 20 - 10).toFixed(1);
    const showGrowth = Math.abs(parseFloat(mockGrowth)) > 2;
    const isPositiveGrowth = parseFloat(mockGrowth) > 0;

    const platforms = [
      { 
        name: 'Android', 
        value: currentValues.android, 
        color: '#22c55e', 
        bgColor: '#f0fdf4',
        icon: Smartphone
      },
      { 
        name: 'iOS', 
        value: currentValues.ios, 
        color: '#8b5cf6', 
        bgColor: '#faf5ff',
        icon: Apple
      },
      { 
        name: 'Web', 
        value: currentValues.net, 
        color: '#3b82f6', 
        bgColor: '#eff6ff',
        icon: Globe
      }
    ].filter(platform => hasValidValue(platform.value));

    if (platforms.length === 0) return null;

    return (
      <div className="kpi-card-enhanced">
        <div className="kpi-card-header-enhanced">
          <div>
            <h3 className="kpi-title-enhanced">{kpi.name}</h3>
          </div>
          {showGrowth && (
            <div className={`growth-indicator-enhanced ${isPositiveGrowth ? 'growth-positive' : 'growth-negative'}`}>
              {isPositiveGrowth ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(mockGrowth)}%</span>
            </div>
          )}
        </div>

        <div className={`platform-grid-enhanced platform-grid-${platforms.length}`}>
          {platforms.map((platform) => (
            <div 
              key={platform.name}
              className="platform-card-enhanced"
              style={{ 
                backgroundColor: platform.bgColor,
                borderColor: platform.color + '40'
              }}
            >
              <div className="platform-label-enhanced">
                <platform.icon size={14} style={{ color: platform.color }} />
                <span style={{ color: platform.color }}>{platform.name}</span>
              </div>
              <p className="platform-value-enhanced" style={{ color: platform.color }}>
                {formatValue(platform.value, kpi.unit)}
              </p>
            </div>
          ))}
        </div>
        
        {kpi.benchmark_value && (
          <div className="benchmark-value">
            Target: {formatValue(kpi.benchmark_value, kpi.unit)}
          </div>
        )}
      </div>
    );
  };

  const SidebarKPIItem = ({ kpi, category }) => {
    return (
      <div 
        className="nav-kpi-item-enhanced"
        onClick={() => handleKPIClick(kpi, category)}
        style={{ cursor: 'pointer' }}
      >
        <span className="kpi-name-sidebar">{kpi.name}</span>
        <ArrowRight size={12} style={{ color: '#94a3b8', opacity: 0.6 }} />
      </div>
    );
  };

  const getPageTitle = () => {
    if (selectedView === 'comparison') return 'KPI Comparison';
    if (selectedView === 'data-management') return 'Data Management';
    if (selectedView === 'add-data') return 'Add KPI Data';
    if (selectedView === 'edit-data') return 'Edit KPI Data';
    if (selectedView === 'import-data') return 'Import KPI Data';
    if (selectedView === 'transactions') return 'Transactions';
    if (selectedView === 'transaction-details') return 'Transaction Segment Analysis'; // NEW
    if (selectedView === 'activities-analytics') return 'Activities Analytics';
    if (selectedView === 'whatsapp-messaging') return 'WhatsApp Messaging';
    if (selectedView === 'kpi-data-list' && selectedKPI) {
      return `${selectedKPI.category.name} → ${selectedKPI.kpi.name}`;
    }
    if (selectedView === 'kpi-data-list') return 'KPI Data Management';
    return 'KPI Dashboard';
  };

  const getPageSubtitle = () => {
    if (selectedView === 'comparison') return 'Compare KPIs across different time periods';
    if (selectedView === 'data-management') return 'Choose what you want to manage';
    if (selectedView === 'add-data') return 'Enter new data points';
    if (selectedView === 'edit-data') return 'Update existing data values';
    if (selectedView === 'import-data') return 'Upload CSV files with multiple data points';
    if (selectedView === 'transactions') return 'View and manage payment transactions';
    if (selectedView === 'transaction-details') return 'Analyze payment behavior patterns and user segments'; // NEW
    if (selectedView === 'activities-analytics') return 'Track activity performance, user engagement, and usage patterns';
    if (selectedView === 'whatsapp-messaging') return 'Send bulk WhatsApp messages to users';
    if (selectedView === 'kpi-data-list' && selectedKPI) {
      return `View and manage data for ${selectedKPI.kpi.name}`;
    }
    if (selectedView === 'kpi-data-list') return 'Manage all KPI entries';
    return 'Performance metrics overview';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div style={{textAlign: 'center'}}>
          <div className="loading-spinner"></div>
          <p style={{marginTop: '16px', color: '#64748b', fontWeight: '600', fontSize: '0.875rem'}}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex dashboard-container">
      {/* Enhanced Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} sidebar overflow-hidden flex flex-col`}>
        <div className="sidebar-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="sidebar-title">KPI Analytics</h1>
              <p className="sidebar-subtitle">Performance Dashboard</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="btn-icon"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="nav-section-enhanced">
            <div 
              onClick={handleBackToDashboard}
              className={`nav-item ${selectedView === 'dashboard' ? 'nav-item-active' : ''}`}
            >
              <Home size={16} />
              <span>Dashboard</span>
            </div>

            <div 
              onClick={() => {
                setSelectedView('comparison');
                setSelectedKPI(null);
                setEditingValueId(null);
              }}
              className={`nav-item ${selectedView === 'comparison' ? 'nav-item-active' : ''}`}
            >
              <TrendingUp size={16} />
              <span>Compare KPIs</span>
            </div>

            <div 
              onClick={handleDataManagementMenu}
              className={`nav-item ${selectedView === 'data-management' || selectedView === 'kpi-data-list' ? 'nav-item-active' : ''}`}
            >
              <Database size={16} />
              <span>KPI Data</span>
            </div>

            <div 
              onClick={handleAddDataDirect}
              className={`nav-item ${selectedView === 'add-data' || selectedView === 'edit-data' || selectedView === 'import-data' ? 'nav-item-active' : ''}`}
            >
              <Plus size={16} />
              <span>Add KPI Data</span>
            </div>

            <div className="nav-divider"></div>

            {/* Stats Section */}
            <div className="nav-category-label">Analytics</div>
            
            <div className="category-section">
              <div 
                onClick={toggleStats}
                className="nav-category-enhanced"
              >
                <BarChart size={16} />
                <span className="flex-1">Analytics</span>
                <span className="category-count">2</span>
                {openStats === 'stats' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              
              {openStats === 'stats' && (
                <div className="kpi-list-enhanced slide-in">
                  <div 
                    className="nav-kpi-item-enhanced"
                    onClick={handleTransactionsMenu}
                    style={{ cursor: 'pointer' }}
                  >
                    <CreditCard size={14} style={{ color: '#6b7280', marginRight: '8px' }} />
                    <span className="kpi-name-sidebar">Transactions</span>
                    <ArrowRight size={12} style={{ color: '#94a3b8', opacity: 0.6 }} />
                  </div>
                  
                  <div 
                    className="nav-kpi-item-enhanced"
                    onClick={handleActivitiesMenu}
                    style={{ cursor: 'pointer' }}
                  >
                    <Play size={14} style={{ color: '#6b7280', marginRight: '8px' }} />
                    <span className="kpi-name-sidebar">Activities</span>
                    <ArrowRight size={12} style={{ color: '#94a3b8', opacity: 0.6 }} />
                  </div>
                </div>
              )}
            </div>

            <div className="nav-divider"></div>

            <div className="nav-category-label">Categories</div>
            
            {dashboardData.map(category => (
              <div key={category.id} className="category-section">
                <div 
                  onClick={() => toggleCategory(category.id)}
                  className="nav-category-enhanced"
                >
                  {React.createElement(categoryIcons[category.name] || BarChart3, { size: 16 })}
                  <span className="flex-1">{category.name}</span>
                  <span className="category-count">
                    {category.kpis.length}
                  </span>
                  {openCategory === category.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {openCategory === category.id && (
                  <div className="kpi-list-enhanced slide-in">
                    {category.kpis.map(kpi => (
                      <SidebarKPIItem key={kpi.id} kpi={kpi} category={category} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dynamic Header */}
        <header className="header" style={{padding: '12px 16px'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{gap: '12px'}}>
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="btn-icon">
                  <Menu size={16} />
                </button>
              )}
              <div>
                <h1 className="header-title">
                  {getPageTitle()}
                </h1>
                <p className="header-subtitle">
                  {getPageSubtitle()}
                </p>
              </div>
            </div>

            <div className="flex items-center" style={{gap: '12px'}}>
              {selectedView === 'dashboard' && (
                <>
                  <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onApply={handleDateRangeApply}
                    availableDateRange={availableDateRange}
                    loading={datePickerLoading}
                  />
                  
                  <button className="btn-primary">
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                </>
              )}

              {/* UPDATED: Show date picker and working buttons for transactions */}
              {selectedView === 'transactions' && (
                <>
                  <DateRangePicker
                    startDate={transactionDateRange.startDate}
                    endDate={transactionDateRange.endDate}
                    onApply={handleTransactionDateRangeApply}
                    availableDateRange={availableDateRange}
                    loading={datePickerLoading}
                  />
                  
                  <button 
                    onClick={handleTransactionDetails}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={14} />
                    <span>Details</span>
                  </button>
                  
                  <button 
                    onClick={handleExportTransactions}
                    className="btn-primary"
                  >
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                </>
              )}

              {/* NEW: Show back button for transaction details */}
              {selectedView === 'transaction-details' && (
                <button 
                  onClick={() => setSelectedView('transactions')}
                  className="btn-secondary"
                >
                  Back to Transactions
                </button>
              )}

              {selectedView === 'activities-analytics' && (
                <>
                  <DateRangePicker
                    startDate={transactionDateRange.startDate}
                    endDate={transactionDateRange.endDate}
                    onApply={handleTransactionDateRangeApply}
                    availableDateRange={availableDateRange}
                    loading={datePickerLoading}
                  />
                  
                  <button className="btn-primary">
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={`flex-1 ${selectedView === 'comparison' ? 'overflow-auto' : 'overflow-hidden'}`}>
            {selectedView === 'comparison' ? (
              <KPIComparison />
            ) : selectedView === 'data-management' ? (
              <AddKPIData onBack={handleBackToDashboard} />
            ) : selectedView === 'add-data' ? (
              <KPIDataForm 
                onBack={handleFormBack} 
                onImportData={handleImportData}
                editingValueId={null}
                onSuccess={() => {
                  console.log('✅ Add KPI data successful, refreshing and going back');
                  handleDataRefresh();
                  handleFormBack();
                }}
              />
            ) : selectedView === 'import-data' ? (
              <KPIBulkImport 
                onBack={handleImportBack}
              />
            ) : selectedView === 'edit-data' ? (
              <KPIDataForm 
                onBack={handleFormBack} 
                onImportData={handleImportData}
                editingValueId={editingValueId}
                onSuccess={() => {
                  console.log('✅ Edit KPI data successful, refreshing and going back');
                  handleDataRefresh();
                  handleFormBack();
                }}
              />
            ) : selectedView === 'transactions' ? (
              <TransactionList 
                onEdit={(transactionId) => {
                  console.log('✏️ Edit transaction:', transactionId);
                }}
                onBack={handleBackToDashboard}
                showBackButton={true}
                dateRange={transactionDateRange}
                onDateRangeChange={handleTransactionDateRangeChange}
                onExport={handleExportTransactions} // NEW: Pass export function
              />
            ) : selectedView === 'transaction-details' ? ( // NEW: Add transaction details view
              <div style={{ padding: '16px' }}>
                <TransactionDetails
                  transactionId="all"
                  onBack={() => setSelectedView('transactions')}
                />
              </div>
            ) : selectedView === 'activities-analytics' ? (
              <ActivitiesAnalytics 
                onEdit={(activityId) => {
                  console.log('✏️ Edit activity:', activityId);
                }}
                onBack={handleBackToDashboard}
                showBackButton={true}
                dateRange={transactionDateRange}
                onDateRangeChange={handleTransactionDateRangeChange}
              />
            ) : selectedView === 'whatsapp-messaging' ? (
              <WhatsAppMessaging 
                onBack={handleBackToDashboard}
                showBackButton={true}
              />
            ) : selectedView === 'kpi-data-list' ? (
              <KPIDataList 
                onAdd={handleAddData}
                onEdit={handleEditData}
                initialFilters={selectedKPI ? {
                  categoryId: selectedKPI.category.id,
                  kpiId: selectedKPI.kpi.id
                } : {}}
                onBack={handleBackToDashboard}
                showBackButton={true}
              />
            )  : (
            /* Dashboard Content */
            <div className="dashboard-content">
              {dashboardData.length > 0 ? (
                <div className="dashboard-sections">
                  {dashboardData.map((category) => (
                    <div key={category.id} className="category-section-main">
                      <div className="section-header-enhanced">
                        <div className="section-icon-enhanced">
                          {React.createElement(categoryIcons[category.name] || BarChart3, { size: 20 })}
                        </div>
                        <div>
                          <h2 className="section-title">{category.name}</h2>
                          <p className="section-subtitle">{category.kpis.filter(kpi => 
                            kpi.currentValues && (
                              hasValidValue(kpi.currentValues.android) || 
                              hasValidValue(kpi.currentValues.ios) || 
                              hasValidValue(kpi.currentValues.net)
                            )
                          ).length} metrics</p>
                        </div>
                      </div>
                      
                      <div className="dashboard-grid-enhanced">
                        {category.kpis.map((kpi) => (
                          <KPICard key={kpi.id} kpi={kpi} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <BarChart3 size={48} style={{color: '#cbd5e1', marginBottom: '16px'}} />
                  <h3 className="empty-state-title">No Data Available</h3>
                  <p className="empty-state-subtitle">
                    No KPI data found for the selected date range.
                  </p>
                  <button 
                    onClick={handleAddDataDirect}
                    className="btn-primary"
                  >
                    <Plus size={14} />
                    <span>Add Data</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;