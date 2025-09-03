import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Dashboard APIs (existing code...)
export const getDashboardData = async (startDate = null, endDate = null) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    console.log('Fetching dashboard data with params:', params);
    const response = await api.get('/kpis/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export const getAvailableDateRange = async () => {
  try {
    const response = await api.get('/kpis/date-range');
    return response.data;
  } catch (error) {
    console.error('Error fetching date range:', error);
    throw error;
  }
};

export const getLatestKPIs = async () => {
  try {
    const response = await api.get('/kpis/latest');
    return response.data;
  } catch (error) {
    console.error('Error fetching latest KPIs:', error);
    throw error;
  }
};

export const getKPITrend = async (kpiId) => {
  try {
    const response = await api.get(`/kpis/trend/${kpiId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching KPI trend:', error);
    throw error;
  }
};

export const getWeeklyComparison = async () => {
  try {
    const response = await api.get('/kpis/weekly-comparison');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly comparison:', error);
    throw error;
  }
};

// Category APIs (existing code...)
export const getCategories = async () => {
  try {
    console.log('🔄 Fetching categories from API...');
    const response = await api.get('/kpis/categories');
    console.log('✅ Categories API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    console.log('🔄 Creating category with data:', categoryData);
    const response = await api.post('/kpis/categories', categoryData);
    console.log('✅ Create category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    console.log('🔄 Updating category ID:', id, 'with data:', categoryData);
    const response = await api.put(`/kpis/categories/${id}`, categoryData);
    console.log('✅ Update category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    console.log('🔄 Deleting category ID:', id);
    const response = await api.delete(`/kpis/categories/${id}`);
    console.log('✅ Delete category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    throw error;
  }
};

// KPI APIs (existing code...)
export const getKPIs = async () => {
  try {
    console.log('🔄 Fetching KPIs from API...');
    const response = await api.get('/kpis');
    console.log('✅ KPIs API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching KPIs:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const createKPI = async (kpiData) => {
  try {
    console.log('🔄 Creating KPI with data:', kpiData);
    const response = await api.post('/kpis', kpiData);
    console.log('✅ Create KPI response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating KPI:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const updateKPI = async (id, kpiData) => {
  try {
    console.log('🔄 Updating KPI ID:', id, 'with data:', kpiData);
    const response = await api.put(`/kpis/${id}`, kpiData);
    console.log('✅ Update KPI response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating KPI:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const deleteKPI = async (id) => {
  try {
    console.log('🔄 Deleting KPI ID:', id);
    const response = await api.delete(`/kpis/${id}`);
    console.log('✅ Delete KPI response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting KPI:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

// KPI Values APIs (existing code...)
export const getKPIValueById = async (id) => {
  try {
    console.log('🔄 Fetching KPI value ID:', id);
    const response = await api.get(`/kpis/values/${id}`);
    console.log('✅ KPI value response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching KPI value:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const createKPIValue = async (valueData) => {
  try {
    console.log('🔄 Creating KPI value with data:', valueData);
    const response = await api.post('/kpis/values', valueData);
    console.log('✅ Create KPI value response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating KPI value:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const updateKPIValue = async (id, valueData) => {
  try {
    console.log('🔄 Updating KPI value ID:', id, 'with data:', valueData);
    const response = await api.put(`/kpis/values/${id}`, valueData);
    console.log('✅ Update KPI value response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating KPI value:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const deleteKPIValue = async (id) => {
  try {
    console.log('🔄 Deleting KPI value ID:', id);
    const response = await api.delete(`/kpis/values/${id}`);
    console.log('✅ Delete KPI value response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting KPI value:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

// Legacy function for backward compatibility
export const addKPIValues = async (kpiData) => {
  try {
    const response = await api.post('/kpis/add-values', kpiData);
    return response.data;
  } catch (error) {
    console.error('Error adding KPI values:', error);
    throw error;
  }
};

// KPI Data List APIs (existing code...)
export const getKPIDataList = async (filters = {}) => {
  try {
    console.log('🔄 Fetching KPI data list with filters:', filters);
    const response = await api.get('/kpis/data', { params: filters });
    console.log('✅ KPI data list response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching KPI data list:', error);
    throw error;
  }
};

export const getKPIDataListSimple = async () => {
  try {
    console.log('🔄 Fetching simple KPI data list...');
    const response = await api.get('/kpis/data-simple');
    console.log('✅ Simple KPI data list response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching simple KPI data list:', error);
    throw error;
  }
};

export const getKPIDataById = async (id) => {
  try {
    console.log('🔄 Fetching KPI data by ID:', id);
    const response = await api.get(`/kpis/data/${id}`);
    console.log('✅ KPI data by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching KPI data by ID:', error);
    throw error;
  }
};

export const updateKPIData = async (id, data) => {
  try {
    console.log('🔄 Updating KPI data ID:', id, 'with data:', data);
    const response = await api.put(`/kpis/data/${id}`, data);
    console.log('✅ Update KPI data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating KPI data:', error);
    throw error;
  }
};

export const deleteKPIData = async (id) => {
  try {
    console.log('🔄 Deleting KPI data ID:', id);
    const response = await api.delete(`/kpis/data/${id}`);
    console.log('✅ Delete KPI data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting KPI data:', error);
    throw error;
  }
};

// KPI Comparison API (existing code...)
export const getKPIComparison = async (filters = {}) => {
  try {
    console.log('🔄 Fetching KPI comparison with filters:', filters);
    const response = await api.get('/kpis/comparison', { params: filters });
    console.log('✅ KPI comparison response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching KPI comparison:', error);
    throw error;
  }
};

// Bulk import API (existing code...)
export const bulkInsertKPIValues = async (data) => {
  try {
    console.log('🔄 Bulk inserting KPI values:', data);
    const response = await api.post('/kpis/values/bulk', data);
    console.log('✅ Bulk insert response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error bulk inserting KPI values:', error);
    throw error;
  }
};

// NEW: Transaction APIs
export const getTransactions = async (filters = {}) => {
  try {
    console.log('🔄 Fetching transactions with filters:', filters);
    const response = await api.get('/transactions', { params: filters });
    console.log('✅ Transactions response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    throw error;
  }
};

export const getTransactionStats = async () => {
  try {
    console.log('🔄 Fetching transaction stats...');
    const response = await api.get('/transactions/stats');
    console.log('✅ Transaction stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching transaction stats:', error);
    throw error;
  }
};

export const getTransactionById = async (id) => {
  try {
    console.log('🔄 Fetching transaction by ID:', id);
    const response = await api.get(`/transactions/${id}`);
    console.log('✅ Transaction by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching transaction by ID:', error);
    throw error;
  }
};

export const updateTransaction = async (id, transactionData) => {
  try {
    console.log('🔄 Updating transaction ID:', id, 'with data:', transactionData);
    const response = await api.put(`/transactions/${id}`, transactionData);
    console.log('✅ Update transaction response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    console.log('🔄 Deleting transaction ID:', id);
    const response = await api.delete(`/transactions/${id}`);
    console.log('✅ Delete transaction response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    throw error;
  }
  
};





// NEW: Activities APIs (using axios instead of fetch)
export const getActivities = async (filters = {}) => {
  try {
    console.log('🔄 Fetching activities with filters:', filters);
    const response = await api.get('/activities', { params: filters });
    console.log('✅ Activities response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    throw error;
  }
};

export const getActivityStats = async (queryString = '') => {
  try {
    console.log('🔄 Fetching activity stats...');
    // Parse queryString if provided
    const params = {};
    if (queryString && queryString.startsWith('?')) {
      const urlParams = new URLSearchParams(queryString.substring(1));
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
      }
    }
    
    const response = await api.get('/activities/stats', { params });
    console.log('✅ Activity stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    throw error;
  }
};

export const getActivityById = async (id) => {
  try {
    console.log('🔄 Fetching activity by ID:', id);
    const response = await api.get(`/activities/${id}`);
    console.log('✅ Activity by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching activity by ID:', error);
    throw error;
  }
};

export const updateActivity = async (id, activityData) => {
  try {
    console.log('🔄 Updating activity:', id, activityData);
    const response = await api.put(`/activities/${id}`, activityData);
    console.log('✅ Update activity response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating activity:', error);
    throw error;
  }
};

export const deleteActivity = async (id) => {
  try {
    console.log('🔄 Deleting activity:', id);
    const response = await api.delete(`/activities/${id}`);
    console.log('✅ Delete activity response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting activity:', error);
    throw error;
  }
};

export const getActivityTypes = async () => {
  try {
    console.log('🔄 Fetching activity types');
    const response = await api.get('/activities/types');
    console.log('✅ Activity types response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching activity types:', error);
    throw error;
  }
};

export const getActivityCategories = async () => {
  try {
    console.log('🔄 Fetching activity categories');
    const response = await api.get('/activities/categories');
    console.log('✅ Activity categories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching activity categories:', error);
    throw error;
  }
};

export const getActivitiesDateRange = async () => {
  try {
    console.log('🔄 Fetching activities date range');
    const response = await api.get('/activities/date-range');
    console.log('✅ Activities date range response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching activities date range:', error);
    throw error;
  }
};



export const initializeWhatsApp = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    throw error;
  }
};

export const getWhatsAppStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
    return await response.json();
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    throw error;
  }
};

export const sendBulkWhatsAppMessages = async (message, phoneNumbers) => {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, phoneNumbers })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending bulk messages:', error);
    throw error;
  }
};
