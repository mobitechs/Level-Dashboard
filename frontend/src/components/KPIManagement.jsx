import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { getKPIs, getCategories, createKPI, updateKPI, deleteKPI } from '../services/api';

const KPIManagement = ({ onBack, onAddKPI }) => {
  const [kpis, setKpis] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    unit: '',
    data_type: 'numeric',
    benchmark_value: '',
    has_platform_split: false,
    description: '',
    display_order: ''
  });
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Expose the showForm function to parent through callback
  useEffect(() => {
    if (onAddKPI) {
      // Pass the function that opens the form, don't call it immediately
      onAddKPI(() => setShowForm(true));
    }
  }, [onAddKPI]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching KPIs and categories...');
      
      const [kpisResponse, categoriesResponse] = await Promise.all([
        getKPIs(),
        getCategories()
      ]);
      
      console.log('📋 KPIs response:', kpisResponse);
      console.log('📋 Categories response:', categoriesResponse);
      
      if (kpisResponse && kpisResponse.success && Array.isArray(kpisResponse.data)) {
        setKpis(kpisResponse.data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      } else {
        showMessage('error', 'Failed to fetch KPIs: ' + (kpisResponse?.message || 'Unknown error'));
      }
      
      if (categoriesResponse && categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
        setCategories(categoriesResponse.data);
      } else {
        showMessage('error', 'Failed to fetch categories: ' + (categoriesResponse?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error fetching initial data:', err);
      showMessage('error', 'Error fetching data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showMessage('error', 'KPI name is required');
      return;
    }

    if (!formData.code.trim()) {
      showMessage('error', 'KPI code is required');
      return;
    }

    if (!formData.category_id) {
      showMessage('error', 'Category is required');
      return;
    }

    try {
      setSaving(true);
      
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        category_id: parseInt(formData.category_id),
        unit: formData.unit || null,
        data_type: formData.data_type || 'numeric',
        benchmark_value: formData.benchmark_value ? parseFloat(formData.benchmark_value) : null,
        has_platform_split: formData.has_platform_split,
        description: formData.description?.trim() || null,
        display_order: formData.display_order ? parseInt(formData.display_order) : null
      };

      console.log('📤 Submitting KPI data:', submitData);

      let response;
      if (editingKPI) {
        console.log('✏️ Updating KPI ID:', editingKPI.id);
        response = await updateKPI(editingKPI.id, submitData);
      } else {
        console.log('➕ Creating new KPI');
        response = await createKPI(submitData);
      }

      console.log('📋 Save response:', response);

      if (response && response.success) {
        console.log('✅ Save successful');
        await fetchInitialData();
        resetForm();
        showMessage('success', `KPI ${editingKPI ? 'updated' : 'created'} successfully!`);
      } else {
        console.error('❌ Save failed:', response);
        showMessage('error', 'Failed to save KPI: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error saving KPI:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to save KPI. ';
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      showMessage('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (kpi) => {
    setEditingKPI(kpi);
    setFormData({
      name: kpi.name,
      code: kpi.code,
      category_id: kpi.category_id.toString(),
      unit: kpi.unit || '',
      data_type: kpi.data_type || 'numeric',
      benchmark_value: kpi.benchmark_value || '',
      has_platform_split: kpi.has_platform_split || false,
      description: kpi.description || '',
      display_order: kpi.display_order || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, kpiName) => {
    if (!window.confirm(`Are you sure you want to delete the KPI "${kpiName}"?`)) return;
    
    try {
      setDeleting(id);
      console.log('🗑️ Deleting KPI ID:', id);
      const response = await deleteKPI(id);
      console.log('📋 Delete response:', response);
      
      if (response && response.success) {
        await fetchInitialData();
        showMessage('success', 'KPI deleted successfully!');
      } else {
        console.error('❌ Delete failed:', response);
        showMessage('error', 'Failed to delete KPI: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error deleting KPI:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to delete KPI. ';
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

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category_id: '',
      unit: '',
      data_type: 'numeric',
      benchmark_value: '',
      has_platform_split: false,
      description: '',
      display_order: ''
    });
    setEditingKPI(null);
    setShowForm(false);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Message Display */}
      {message.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          margin: '16px 16px 0 16px',
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

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                {editingKPI ? 'Edit KPI' : 'Add New KPI'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                    KPI Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter KPI name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                    KPI Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter KPI code"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., $, %, users"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                    Data Type
                  </label>
                  <select
                    value={formData.data_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="numeric">Numeric</option>
                    <option value="percentage">Percentage</option>
                    <option value="currency">Currency</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                    Benchmark Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.benchmark_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, benchmark_value: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Target value"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Optional description of the KPI"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.has_platform_split}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_platform_split: e.target.checked }))}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Has Platform Split</span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Optional: Display order"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner" style={{ width: '14px', height: '14px' }} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{editingKPI ? 'Update' : 'Create'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPIs List */}
      <div style={{
        flex: 1,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '0 16px 16px 16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 120px 100px 120px 150px',
          gap: '12px',
          padding: '16px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374155',
          flexShrink: 0
        }}>
          <div>KPI Details</div>
          <div>Category</div>
          <div>Unit</div>
          <div>Benchmark</div>
          <div>Platform Split</div>
          <div>Actions</div>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div className="loading-spinner" style={{ marginBottom: '12px' }} />
              <div style={{ color: '#6b7280' }}>Loading KPIs...</div>
            </div>
          ) : kpis.length > 0 ? (
            kpis.map((kpi) => (
              <div
                key={kpi.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 120px 100px 120px 150px',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.875rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{kpi.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{kpi.code}</div>
                  {kpi.description && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                      {kpi.description.substring(0, 50)}{kpi.description.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {getCategoryName(kpi.category_id)}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {kpi.unit || '—'}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {kpi.benchmark_value || '—'}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {kpi.has_platform_split ? 'Yes' : 'No'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(kpi)}
                    className="btn-icon"
                    title="Edit KPI"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(kpi.id, kpi.name)}
                    disabled={deleting === kpi.id}
                    className="btn-icon"
                    style={{ color: '#ef4444' }}
                    title="Delete KPI"
                  >
                    {deleting === kpi.id ? (
                      <div className="loading-spinner" style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              padding: '60px 20px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374155', margin: '0 0 8px 0' }}>
                No KPIs Found
              </h3>
              <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>
                Create your first KPI to start tracking your metrics.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                <Plus size={16} />
                <span>Add First KPI</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPIManagement;