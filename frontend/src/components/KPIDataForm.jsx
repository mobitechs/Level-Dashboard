import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';


const KPIDataForm = ({ onBack, onImportData }) => {
  const [formData, setFormData] = useState({
    category_id: '',
    kpi_id: '',
    date_value: '',
    android_value: '',
    ios_value: '',
    net_value: '',
    data_source: '',
    notes: ''
  });

  const [categories, setCategories] = useState([]);
  const [filteredKpis, setFilteredKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      fetchKPIsByCategory(formData.category_id);
      setFormData(prev => ({ ...prev, kpi_id: '' }));
    } else {
      setFilteredKpis([]);
      setFormData(prev => ({ ...prev, kpi_id: '' }));
    }
  }, [formData.category_id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/kpis/categories`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Categories fetch error:', error);
      setMessage({ type: 'error', text: 'Error loading categories.' });
    }
  };

  const fetchKPIsByCategory = async (categoryId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/kpis`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.data) {
        const filtered = data.data.filter(kpi => kpi.category_id === parseInt(categoryId));
        setFilteredKpis(filtered);
      }
    } catch (error) {
      console.error('KPIs fetch error:', error);
      setMessage({ type: 'error', text: 'Error loading KPIs.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const validateForm = () => {
    if (!formData.category_id) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return false;
    }

    if (!formData.kpi_id) {
      setMessage({ type: 'error', text: 'Please select a KPI' });
      return false;
    }
    
    if (!formData.date_value) {
      setMessage({ type: 'error', text: 'Please select a date' });
      return false;
    }

    if (!formData.android_value && !formData.ios_value && !formData.net_value) {
      setMessage({ type: 'error', text: 'Please provide at least one value (Android, iOS, or Net)' });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    
    try {
      const submitData = {
        kpi_id: parseInt(formData.kpi_id),
        date_value: formData.date_value,
        android_value: formData.android_value ? parseFloat(formData.android_value) : null,
        ios_value: formData.ios_value ? parseFloat(formData.ios_value) : null,
        net_value: formData.net_value ? parseFloat(formData.net_value) : null,
        data_source: formData.data_source || null,
        notes: formData.notes || null
      };

      const response = await fetch(`${API_BASE_URL}/api/kpis/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'KPI data saved successfully!' });
        
        setFormData({
          category_id: '',
          kpi_id: '',
          date_value: '',
          android_value: '',
          ios_value: '',
          net_value: '',
          data_source: '',
          notes: ''
        });
        setFilteredKpis([]);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save KPI data' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ type: 'error', text: 'Error saving data. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      kpi_id: '',
      date_value: '',
      android_value: '',
      ios_value: '',
      net_value: '',
      data_source: '',
      notes: ''
    });
    setFilteredKpis([]);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* MODIFIED: Added header with Import Data button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">KPI Data Entry</h2>
            {onImportData && (
              <button
                onClick={onImportData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
              </button>
            )}
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`p-3 rounded-lg mb-4 flex items-center space-x-2 ${
              message.type === 'error' 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Row 1: Category and KPI Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select KPI *
              </label>
              <select
                name="kpi_id"
                value={formData.kpi_id}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.category_id || loading}
              >
                <option value="">
                  {!formData.category_id ? 'First select category...' : 'Choose KPI...'}
                </option>
                {loading ? (
                  <option>Loading KPIs...</option>
                ) : (
                  filteredKpis.map((kpi) => (
                    <option key={kpi.id} value={kpi.id}>
                      {kpi.name} ({kpi.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Row 2: Date and Data Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date_value"
                value={formData.date_value}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <select
                name="data_source"
                value={formData.data_source}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select source...</option>
                <option value="Analytics">Analytics</option>
                <option value="Database">Database</option>
                <option value="Manual Entry">Manual Entry</option>
                <option value="API">API</option>
                <option value="Report">Report</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 3: Data Values - Android, iOS, Net */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Values * (Enter at least one value)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Android Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="android_value"
                  value={formData.android_value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  iOS Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="ios_value"
                  value={formData.ios_value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Net Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="net_value"
                  value={formData.net_value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Additional notes or comments..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Row 5: Submit and Reset Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              {submitLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{submitLoading ? 'Saving...' : 'Submit KPI Data'}</span>
            </button>
            
            <button
              onClick={resetForm}
              disabled={submitLoading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDataForm;