import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Database,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';

const CategoryManagement = ({ onBack, onAddCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_order: ''
  });
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Expose the showForm function to parent through callback
  useEffect(() => {
    if (onAddCategory) {
      // Pass the function that opens the form, don't call it immediately
      onAddCategory(() => setShowForm(true));
    }
  }, [onAddCategory]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching categories...');
      const response = await getCategories();
      console.log('📋 Categories response:', response);
      
      if (response && response.success && Array.isArray(response.data)) {
        console.log('✅ Categories data:', response.data);
        setCategories(response.data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      } else {
        console.error('❌ Categories fetch failed:', response);
        showMessage('error', 'Failed to fetch categories: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      console.error('Error details:', err.response?.data);
      showMessage('error', 'Error fetching categories: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showMessage('error', 'Category name is required');
      return;
    }

    try {
      setSaving(true);
      
      const submitData = {
        name: formData.name.trim(),
        display_order: formData.display_order ? parseInt(formData.display_order) : null
      };

      console.log('📤 Submitting category data:', submitData);

      let response;
      if (editingCategory) {
        console.log('✏️ Updating category ID:', editingCategory.id);
        response = await updateCategory(editingCategory.id, submitData);
      } else {
        console.log('➕ Creating new category');
        response = await createCategory(submitData);
      }

      console.log('📋 Save response:', response);

      if (response && response.success) {
        console.log('✅ Save successful');
        await fetchCategories();
        resetForm();
        showMessage('success', `Category ${editingCategory ? 'updated' : 'created'} successfully!`);
      } else {
        console.error('❌ Save failed:', response);
        showMessage('error', 'Failed to save category: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error saving category:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to save category. ';
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

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      display_order: category.display_order || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;
    
    try {
      setDeleting(id);
      console.log('🗑️ Deleting category ID:', id);
      const response = await deleteCategory(id);
      console.log('📋 Delete response:', response);
      
      if (response && response.success) {
        await fetchCategories();
        showMessage('success', 'Category deleted successfully!');
      } else {
        console.error('❌ Delete failed:', response);
        showMessage('error', 'Failed to delete category: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error deleting category:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to delete category. ';
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
    setFormData({ name: '', display_order: '' });
    setEditingCategory(null);
    setShowForm(false);
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
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                  Category Name *
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
                  placeholder="Enter category name"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
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
                  placeholder="Optional: Enter display order (1, 2, 3...)"
                />
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
                      <span>{editingCategory ? 'Update' : 'Create'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div style={{
        flex: 1,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 120px 150px',
          gap: '16px',
          padding: '16px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374155',
          flexShrink: 0
        }}>
          <div>Category Name</div>
          <div>Display Order</div>
          <div>Created Date</div>
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
              <div style={{ color: '#6b7280' }}>Loading categories...</div>
            </div>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 120px 150px',
                  gap: '16px',
                  padding: '16px',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.875rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: '500', color: '#1f2937' }}>
                  {category.name}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {category.display_order || '—'}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {category.created_at ? new Date(category.created_at).toLocaleDateString() : '—'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(category)}
                    className="btn-icon"
                    title="Edit category"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={deleting === category.id}
                    className="btn-icon"
                    style={{ color: '#ef4444' }}
                    title="Delete category"
                  >
                    {deleting === category.id ? (
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
              <Database size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374155', margin: '0 0 8px 0' }}>
                No Categories Found
              </h3>
              <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>
                Create your first category to get started organizing your KPIs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;