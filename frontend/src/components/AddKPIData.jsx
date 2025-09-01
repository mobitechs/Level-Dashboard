import React, { useState, useRef } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Database, 
  BarChart3, 
  Target,
  List,
  Settings
} from 'lucide-react';
import CategoryManagement from './CategoryManagement';
import KPIManagement from './KPIManagement';
import KPIDataList from './KPIDataList';
import KPIDataForm from './KPIDataForm';

const AddKPIData = ({ onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showKPIDataForm, setShowKPIDataForm] = useState(false);
  const [editingValueId, setEditingValueId] = useState(null);
  
  // Use refs to store callback functions from child components
  const addCategoryCallbackRef = useRef(null);
  const addKPICallbackRef = useRef(null);

  const managementOptions = [
    {
      id: 'categories',
      title: 'Categories',
      description: 'Manage KPI categories and organization',
      icon: Database,
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
    {
      id: 'kpis',
      title: 'KPIs',
      description: 'Manage Key Performance Indicators',
      icon: BarChart3,
      color: '#10b981',
      bgColor: '#f0fdf4'
    },
    {
      id: 'kpi-data',
      title: 'KPI Data',
      description: 'Add and manage KPI values and metrics',
      icon: Target,
      color: '#f59e0b',
      bgColor: '#fffbeb'
    }
  ];

  const handleBack = () => {
    if (selectedOption) {
      setSelectedOption(null);
      setShowKPIDataForm(false);
      setEditingValueId(null);
    } else {
      onBack();
    }
  };

  const handleKPIDataAdd = () => {
    setEditingValueId(null);
    setShowKPIDataForm(true);
  };

  const handleKPIDataEdit = (valueId) => {
    console.log('📝 Editing KPI value with ID:', valueId);
    setEditingValueId(valueId);
    setShowKPIDataForm(true);
  };

  const handleKPIDataFormBack = () => {
    setEditingValueId(null);
    setShowKPIDataForm(false);
  };

  // Callback setters for child components
  const setAddCategoryCallback = (callback) => {
    addCategoryCallbackRef.current = callback;
  };

  const setAddKPICallback = (callback) => {
    addKPICallbackRef.current = callback;
  };

  const renderSelectedComponent = () => {
    switch (selectedOption) {
      case 'categories':
        return <CategoryManagement onBack={() => setSelectedOption(null)} onAddCategory={setAddCategoryCallback} />;
      case 'kpis':
        return <KPIManagement onBack={() => setSelectedOption(null)} onAddKPI={setAddKPICallback} />;
      case 'kpi-data':
        if (showKPIDataForm) {
          return (
            <div style={{ height: '100%', padding: '24px' }}>
              <KPIDataForm 
                onBack={handleKPIDataFormBack}
                editingValueId={editingValueId}
              />
            </div>
          );
        } else {
          return (
            <KPIDataList 
              onAdd={handleKPIDataAdd}
              onEdit={handleKPIDataEdit}
              initialFilters={{}}
              onBack={null}
              showBackButton={false}
            />
          );
        }
      default:
        return null;
    }
  };

  // Get the appropriate add button based on selected option
  const getAddButton = () => {
    switch (selectedOption) {
      case 'categories':
        return (
          <button 
            onClick={() => addCategoryCallbackRef.current && addCategoryCallbackRef.current()}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        );
      case 'kpis':
        return (
          <button 
            onClick={() => addKPICallbackRef.current && addKPICallbackRef.current()}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>Add KPI</span>
          </button>
        );
      case 'kpi-data':
        // Only show add button when in form mode, not in list mode
        // KPIDataList component has its own add button
        if (showKPIDataForm) {
          return null;
        }
        return (
          <button onClick={handleKPIDataAdd} className="btn-primary">
            <Plus size={16} />
            <span>Add KPI Data</span>
          </button>
        );
      default:
        return null;
    }
  };

  const handleOptionClick = (optionId) => {
    setSelectedOption(optionId);
    
    if (optionId === 'kpi-data') {
      setShowKPIDataForm(false);
      setEditingValueId(null);
    }
  };

  // Don't show header for kpi-data when in form mode, as KPIDataForm has its own header
  const shouldShowHeader = selectedOption && !(selectedOption === 'kpi-data' && showKPIDataForm);

  if (selectedOption) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header with Back Button, Title, and Add Button in Same Row */}
        {shouldShowHeader && (
          <div style={{ 
            background: 'white', 
            borderBottom: '1px solid #e5e7eb', 
            padding: '16px 24px',
            flexShrink: 0
          }}>
            {/* Single Row with Back Button, Title, and Add Button */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={handleBack}
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

                {/* Title and Subtitle together */}
                <div>
                  <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {selectedOption === 'categories' ? 'Category Management' :
                     selectedOption === 'kpis' ? 'KPI Management' : 'KPI Data Management'}
                  </h1>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '2px 0 0 0'
                  }}>
                    {selectedOption === 'categories' ? 'Manage KPI categories and organization' :
                     selectedOption === 'kpis' ? 'Manage Key Performance Indicators' : 
                     'View, add, and manage all KPI data entries'}
                  </p>
                </div>
              </div>

              {/* Add Button at the end of the row */}
              {getAddButton()}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {renderSelectedComponent()}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button 
          onClick={handleBack}
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
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 8px 0'
        }}>
          Data Management
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          margin: 0
        }}>
          Choose what you'd like to manage
        </p>
      </div>

      {/* Management Options Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1200px'
      }}>
        {managementOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            style={{
              padding: '24px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: option.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <option.icon size={24} color={option.color} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 8px 0'
                }}>
                  {option.title}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {option.description}
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #f3f4f6'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: option.color
              }}>
                Manage {option.title}
              </span>
              <div style={{
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: option.bgColor,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Settings size={14} color={option.color} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddKPIData;