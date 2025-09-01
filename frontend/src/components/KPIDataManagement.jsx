import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import KPIDataList from './KPIDataList';
import KPIDataForm from './KPIDataForm';

const KPIDataManagement = ({ onBack, initialFilters = {} }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
  const [editingValueId, setEditingValueId] = useState(null);
  const [listFilters, setListFilters] = useState(initialFilters);

  // Handle navigation to add form
  const handleAdd = () => {
    setEditingValueId(null);
    setCurrentView('form');
  };

  // Handle navigation to edit form
  const handleEdit = (valueId) => {
    console.log('📝 Editing KPI value with ID:', valueId);
    setEditingValueId(valueId);
    setCurrentView('form');
  };

  // Handle back navigation from form to list
  const handleBackToList = () => {
    setEditingValueId(null);
    setCurrentView('list');
  };

  // Handle back navigation from list to dashboard
  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    }
  };

  // Get page title based on current view
  const getPageTitle = () => {
    if (currentView === 'form') {
      return editingValueId ? 'Edit KPI Data' : 'Add KPI Data';
    }
    return 'KPI Data Management';
  };

  // Get page subtitle based on current view
  const getPageSubtitle = () => {
    if (currentView === 'form') {
      return editingValueId ? 'Update existing data values' : 'Enter new data points';
    }
    return 'View, add, and manage all KPI data entries';
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        padding: '16px 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Back button - always goes back to selection page */}
            <button 
              onClick={handleBackToDashboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374155',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Management</span>
            </button>
            
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                {getPageTitle()}
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '2px 0 0 0'
              }}>
                {getPageSubtitle()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {currentView === 'list' ? (
          <KPIDataList 
            onAdd={handleAdd}
            onEdit={handleEdit}
            initialFilters={listFilters}
            onBack={null} // We handle back navigation in the header
            showBackButton={false} // Don't show the back button in KPIDataList
          />
        ) : (
          <KPIDataForm 
            onBack={handleBackToList}
            editingValueId={editingValueId}
          />
        )}
      </div>
    </div>
  );
};

export default KPIDataManagement;