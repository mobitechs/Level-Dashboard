import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  Smartphone,
  Apple,
  Globe,
  BarChart3,
  AlertCircle,
  CheckCircle,
  X,
  Filter,
  Download,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  getKPIComparison, 
  getCategories, 
  getAvailableDateRange 
} from '../services/api';
import SimpleDatePicker from './SimpleDatePicker';

const KPIComparison = () => {
  const [comparisonData, setComparisonData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableDateRange, setAvailableDateRange] = useState({ min_date: '', max_date: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Date range states - Period 1 is Previous, Period 2 is Recent
  const [dateRange1, setDateRange1] = useState({ startDate: '', endDate: '' }); // Previous
  const [dateRange2, setDateRange2] = useState({ startDate: '', endDate: '' }); // Recent
  
  // Filter states
  const [filters, setFilters] = useState({
    categoryId: '',
    kpiId: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

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
        
        // Set default date ranges - Period 2 (Recent) is most recent, Period 1 (Previous) is before that
        const maxDate = dateRangeResponse.data.max_date;
        const endDate2 = maxDate; // Recent period ends at max date
        const startDate2 = new Date(new Date(maxDate) - 30 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        
        const endDate1 = new Date(new Date(startDate2) - 1 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]; // Previous period ends day before recent starts
        const startDate1 = new Date(new Date(endDate1) - 30 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        
        setDateRange1({ // Previous period
          startDate: startDate1 < dateRangeResponse.data.min_date ? dateRangeResponse.data.min_date : startDate1, 
          endDate: endDate1 
        });
        setDateRange2({ // Recent period
          startDate: startDate2 < dateRangeResponse.data.min_date ? dateRangeResponse.data.min_date : startDate2, 
          endDate: endDate2 
        });
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      showMessage('error', 'Error loading initial data: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCompare = async () => {
    if (!dateRange1.startDate || !dateRange1.endDate || !dateRange2.startDate || !dateRange2.endDate) {
      showMessage('error', 'Please select both date ranges');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Starting comparison with ranges:', dateRange1, dateRange2);
      
      const comparisonParams = {
        startDate1: dateRange1.startDate,
        endDate1: dateRange1.endDate,
        startDate2: dateRange2.startDate,
        endDate2: dateRange2.endDate,
        categoryId: filters.categoryId,
        kpiId: filters.kpiId
      };

      const response = await getKPIComparison(comparisonParams);
      
      if (response.success) {
        setComparisonData(response.data.categories);
        console.log('✅ Comparison data loaded:', response.data);
        
        if (response.data.categories.length === 0) {
          showMessage('error', 'No data found for the selected date ranges and filters');
        }
      } else {
        showMessage('error', 'Failed to fetch comparison data: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error fetching comparison:', err);
      showMessage('error', 'Error fetching comparison data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDateRange1Apply = (startDate, endDate) => {
    setDateRange1({ startDate, endDate });
  };

  const handleDateRange2Apply = (startDate, endDate) => {
    setDateRange2({ startDate, endDate });
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

  const formatValueForExcel = (value, unit) => {
    if (value === null || value === undefined) return '—';
    
    switch (unit) {
      case '$':
        return value; // Return raw number for Excel, format will be applied via Excel formatting
      case '%':
        return parseFloat(value) / 100; // Convert to decimal for Excel percentage formatting
      case 'installs':
      case 'users':
      case 'visits':
      case 'crashes':
        return value;
      case 'ratio':
        return parseFloat(value);
      default:
        return typeof value === 'number' ? value : value;
    }
  };

  const formatGrowth = (growth) => {
    if (growth === null || growth === undefined) return { text: '—', color: '#6b7280' };
    
    const formatted = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
    const color = growth > 0 ? '#16a34a' : growth < 0 ? '#dc2626' : '#6b7280';
    
    return { text: formatted, color };
  };

  const getGrowthIcon = (growth) => {
    if (growth === null || growth === undefined) return <Minus size={14} color="#6b7280" />;
    if (growth > 0) return <TrendingUp size={14} color="#16a34a" />;
    if (growth < 0) return <TrendingDown size={14} color="#dc2626" />;
    return <Minus size={14} color="#6b7280" />;
  };

  const getFilteredKPIs = () => {
    if (!filters.categoryId) return [];
    const selectedCategory = categories.find(cat => cat.id == filters.categoryId);
    return selectedCategory?.kpis || [];
  };

  const formatDateRange = (range) => {
    const start = new Date(range.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(range.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (groupedData.length === 0) {
      showMessage('error', 'No data to export');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = [];
      
      // Add title row
      excelData.push([
        'KPI Comparison Analysis',
        '',
        '',
        '',
        ''
      ]);
      
      // Add date range info
      excelData.push([
        `Period 1 (Previous): ${formatDateRange(dateRange1)}`,
        '',
        '',
        '',
        ''
      ]);
      excelData.push([
        `Period 2 (Recent): ${formatDateRange(dateRange2)}`,
        '',
        '',
        '',
        ''
      ]);
      
      // Add empty row
      excelData.push(['', '', '', '', '']);
      
      // Add headers
      const headerRow = [
        'Category',
        'KPI & Platform',
        'Period 1 Value (Previous)',
        'Period 2 Value (Recent)',
        'Growth (%)'
      ];
      excelData.push(headerRow);

      // Add data rows
      groupedData.forEach(categoryData => {
        categoryData.kpis.forEach((kpiData, kpiIndex) => {
          kpiData.platforms.forEach((platform, platformIndex) => {
            const row = [
              (kpiIndex === 0 && platformIndex === 0) ? categoryData.categoryName : '', // Only show category name on first KPI's first platform
              platformIndex === 0 ? `${kpiData.kpiName} - ${platform.platform}` : `  ${platform.platform}`,
              formatValueForExcel(platform.period1, platform.unit),
              formatValueForExcel(platform.period2, platform.unit),
              platform.growth !== null && platform.growth !== undefined ? platform.growth / 100 : '—' // Convert to decimal for Excel
            ];
            excelData.push(row);
          });
        });
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Category
        { wch: 35 }, // KPI & Platform
        { wch: 20 }, // Period 1
        { wch: 20 }, // Period 2
        { wch: 15 }  // Growth
      ];
      ws['!cols'] = colWidths;

      // Apply basic formatting to headers
      const range = XLSX.utils.decode_range(ws['!ref']);
      const headerRowIndex = 4; // Headers are in row 5 (0-indexed as 4)

      // Style the data based on growth values
      let dataRowIndex = headerRowIndex + 1;
      groupedData.forEach(categoryData => {
        categoryData.kpis.forEach(kpiData => {
          kpiData.platforms.forEach((platform) => {
            // Format Period 1 and Period 2 values based on unit
            const period1CellRef = XLSX.utils.encode_cell({ r: dataRowIndex, c: 2 });
            const period2CellRef = XLSX.utils.encode_cell({ r: dataRowIndex, c: 3 });
            const growthCellRef = XLSX.utils.encode_cell({ r: dataRowIndex, c: 4 });
            
            // Apply number formatting
            if (ws[period1CellRef] && platform.unit === '$') {
              ws[period1CellRef].z = '"$"#,##0';
            } else if (ws[period1CellRef] && platform.unit === '%') {
              ws[period1CellRef].z = '0.0%';
            }
            
            if (ws[period2CellRef] && platform.unit === '$') {
              ws[period2CellRef].z = '"$"#,##0';
            } else if (ws[period2CellRef] && platform.unit === '%') {
              ws[period2CellRef].z = '0.0%';
            }

            // Format growth cell with percentage and background color
            if (ws[growthCellRef] && platform.growth !== null && platform.growth !== undefined) {
              ws[growthCellRef].z = '0.0%';
              
              // Add background color based on growth
              if (platform.growth > 0) {
                ws[growthCellRef].s = { fill: { fgColor: { rgb: "DCFCE7" } } }; // Light green
              } else if (platform.growth < 0) {
                ws[growthCellRef].s = { fill: { fgColor: { rgb: "FEE2E2" } } }; // Light red
              } else {
                ws[growthCellRef].s = { fill: { fgColor: { rgb: "F3F4F6" } } }; // Light gray
              }
            }

            dataRowIndex++;
          });
        });
      });

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'KPI Comparison');

      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const filename = `KPI_Comparison_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      showMessage('success', `Excel file "${filename}" has been downloaded successfully!`);
      
    } catch (error) {
      console.error('Export error:', error);
      showMessage('error', 'Failed to export Excel file: ' + error.message);
    }
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (groupedData.length === 0) {
      showMessage('error', 'No data to export');
      return;
    }

    try {
      console.log('Starting PDF export...');
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set document properties
      doc.setProperties({
        title: 'KPI Comparison Analysis',
        subject: 'KPI Performance Comparison Report',
        author: 'KPI Dashboard',
        creator: 'KPI Dashboard'
      });

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('KPI Comparison Analysis', 20, 20);

      // Add date ranges
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period 1 (Previous): ${formatDateRange(dateRange1)}`, 20, 35);
      doc.text(`Period 2 (Recent): ${formatDateRange(dateRange2)}`, 20, 45);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, 55);

      // Prepare table data
      const tableData = [];
      
      groupedData.forEach(categoryData => {
        categoryData.kpis.forEach((kpiData, kpiIndex) => {
          kpiData.platforms.forEach((platform, platformIndex) => {
            const row = [
              (kpiIndex === 0 && platformIndex === 0) ? categoryData.categoryName : '', // Only show category name on first KPI's first platform
              platformIndex === 0 ? `${kpiData.kpiName} - ${platform.platform}` : `  ${platform.platform}`,
              formatValue(platform.period1, platform.unit),
              formatValue(platform.period2, platform.unit),
              formatGrowth(platform.growth).text
            ];
            tableData.push(row);
          });
        });
      });

      console.log('Table data prepared:', tableData.length, 'rows');

      // Create table using autoTable
      autoTable(doc, {
        head: [['Category', 'KPI & Platform', 'Period 1 Value (Previous)', 'Period 2 Value (Recent)', 'Growth (%)']],
        body: tableData,
        startY: 65,
        theme: 'grid',
        headStyles: {
          fillColor: [243, 244, 246], // Light gray background
          textColor: [55, 65, 81], // Dark gray text
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { // Category
            halign: 'left',
            fontStyle: 'bold',
            fillColor: [248, 250, 252] // Very light blue background for categories
          },
          1: { // KPI & Platform
            halign: 'left',
            cellWidth: 60
          },
          2: { // Period 1
            halign: 'center',
            textColor: [22, 101, 52] // Green color for previous period
          },
          3: { // Period 2
            halign: 'center',
            textColor: [30, 64, 175] // Blue color for recent period
          },
          4: { // Growth
            halign: 'center',
            fontStyle: 'bold'
          }
        },
        didParseCell: function(data) {
          // Color code the growth column based on value
          if (data.column.index === 4) {
            const growthText = data.cell.text[0];
            if (growthText && growthText !== '—') {
              if (growthText.startsWith('+')) {
                data.cell.styles.fillColor = [220, 252, 231]; // Light green
                data.cell.styles.textColor = [22, 163, 74]; // Green text
              } else if (growthText.startsWith('-')) {
                data.cell.styles.fillColor = [254, 226, 226]; // Light red
                data.cell.styles.textColor = [220, 38, 38]; // Red text
              } else {
                data.cell.styles.fillColor = [243, 244, 246]; // Light gray
                data.cell.styles.textColor = [107, 114, 128]; // Gray text
              }
            }
          }
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Very light gray for alternate rows
        },
        margin: { top: 20, right: 20, bottom: 20, left: 20 }
      });

      // Add footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      }

      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const filename = `KPI_Comparison_${dateStr}.pdf`;

      console.log('Saving PDF...');
      
      // Save the PDF
      doc.save(filename);
      
      showMessage('success', `PDF file "${filename}" has been downloaded successfully!`);
      
    } catch (error) {
      console.error('PDF Export error:', error);
      showMessage('error', 'Failed to export PDF file: ' + error.message);
    }
  };

  // Create grouped structure for better table rendering
  const getGroupedData = () => {
    const groupedData = [];
    
    comparisonData.forEach(category => {
      const categoryData = {
        categoryName: category.name,
        kpis: []
      };

      category.kpis.forEach(kpi => {
        const kpiData = {
          kpiName: kpi.kpi_name,
          platforms: []
        };

        // Add platforms that have data
        if (kpi.has_platform_split) {
          if (kpi.period1.android !== null || kpi.period2.android !== null) {
            kpiData.platforms.push({
              platform: 'Android',
              icon: Smartphone,
              color: '#10b981',
              period1: kpi.period1.android,
              period2: kpi.period2.android,
              growth: kpi.growth.android,
              unit: kpi.unit
            });
          }
          if (kpi.period1.ios !== null || kpi.period2.ios !== null) {
            kpiData.platforms.push({
              platform: 'iOS',
              icon: Apple,
              color: '#64748b',
              period1: kpi.period1.ios,
              period2: kpi.period2.ios,
              growth: kpi.growth.ios,
              unit: kpi.unit
            });
          }
        }
        
        // Always add net/total row
        if (kpi.period1.net !== null || kpi.period2.net !== null) {
          kpiData.platforms.push({
            platform: kpi.has_platform_split ? 'Total' : 'Overall',
            icon: Globe,
            color: '#3b82f6',
            period1: kpi.period1.net,
            period2: kpi.period2.net,
            growth: kpi.growth.net,
            unit: kpi.unit
          });
        }

        if (kpiData.platforms.length > 0) {
          categoryData.kpis.push(kpiData);
        }
      });

      if (categoryData.kpis.length > 0) {
        groupedData.push(categoryData);
      }
    });

    return groupedData;
  };

  const groupedData = getGroupedData();

  return (
    <div style={{ 
      padding: '24px',
      background: '#f8fafc'
    }}>
      {/* Message Display */}
      {message.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          borderRadius: '8px',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#dc2626' : '#16a34a',
          maxWidth: '1200px',
          margin: '0 auto 24px auto'
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

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Controls Section */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 24px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <BarChart3 size={24} />
            KPI Comparison Analysis
          </h1>

          {/* Date Range Pickers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Period 1 - Previous */}
            <div style={{
              padding: '20px',
              background: '#f0fdf4',
              border: '2px solid #bbf7d0',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#166534',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={18} />
                Period 1 (Previous)
              </h3>
              <SimpleDatePicker
                startDate={dateRange1.startDate}
                endDate={dateRange1.endDate}
                onApply={handleDateRange1Apply}
                availableDateRange={availableDateRange}
                label="Select Period 1 dates"
              />
            </div>

            {/* Period 2 - Recent */}
            <div style={{
              padding: '20px',
              background: '#eff6ff',
              border: '2px solid #bfdbfe',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e40af',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={18} />
                Period 2 (Recent)
              </h3>
              <SimpleDatePicker
                startDate={dateRange2.startDate}
                endDate={dateRange2.endDate}
                onApply={handleDateRange2Apply}
                availableDateRange={availableDateRange}
                label="Select Period 2 dates"
              />
            </div>
          </div>

          {/* Filters and Compare Button */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '16px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                marginBottom: '6px',
                color: '#374155'
              }}>
                Category Filter
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value, kpiId: '' }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                marginBottom: '6px',
                color: '#374155'
              }}>
                KPI Filter
              </label>
              <select
                value={filters.kpiId}
                onChange={(e) => setFilters(prev => ({ ...prev, kpiId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                <option value="">All KPIs</option>
                {getFilteredKPIs().map(kpi => (
                  <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleCompare}
              disabled={loading}
              className="btn-primary"
              style={{ 
                padding: '12px 24px',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '120px'
              }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  <span>Compare</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {groupedData.length > 0 && (
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Results Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: '0 0 6px 0'
                  }}>
                    Comparison Results
                  </h2>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <span style={{ color: '#166534', fontWeight: '600' }}>{formatDateRange(dateRange1)}</span>
                    {' vs '}
                    <span style={{ color: '#1e40af', fontWeight: '600' }}>{formatDateRange(dateRange2)}</span>
                    {' • '}
                    <span>{groupedData.reduce((acc, cat) => acc + cat.kpis.reduce((kpiAcc, kpi) => kpiAcc + kpi.platforms.length, 0), 0)} records</span>
                  </div>
                </div>
                
                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={exportToPDF}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '10px 16px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#b91c1c';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#dc2626';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <FileText size={14} />
                    <span>Export PDF</span>
                  </button>
                  
                  <button 
                    onClick={exportToExcel}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '10px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#059669';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#10b981';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <Download size={14} />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {/* Table Header */}
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#374155',
                      borderBottom: '2px solid #e5e7eb',
                      width: '15%'
                    }}>
                      Category
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#374155',
                      borderBottom: '2px solid #e5e7eb',
                      width: '25%'
                    }}>
                      KPI & Platform
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#166534',
                      borderBottom: '2px solid #e5e7eb',
                      width: '20%'
                    }}>
                      Period 1 Value (Previous)
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#1e40af',
                      borderBottom: '2px solid #e5e7eb',
                      width: '20%'
                    }}>
                      Period 2 Value (Recent)
                    </th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#374155',
                      borderBottom: '2px solid #e5e7eb',
                      width: '20%'
                    }}>
                      Growth
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {groupedData.map((categoryData, categoryIndex) => {
                    const categoryRowCount = categoryData.kpis.reduce((acc, kpi) => acc + kpi.platforms.length, 0);
                    let currentRowIndex = 0;

                    return categoryData.kpis.map((kpiData, kpiIndex) => {
                      const kpiRowCount = kpiData.platforms.length;
                      const isLastKPIInCategory = kpiIndex === categoryData.kpis.length - 1;
                      
                      return kpiData.platforms.map((platform, platformIndex) => {
                        const isFirstRowInCategory = currentRowIndex === 0;
                        const isFirstRowInKPI = platformIndex === 0;
                        const isLastRowInKPI = platformIndex === kpiData.platforms.length - 1;
                        const isLastRowInCategory = isLastKPIInCategory && isLastRowInKPI;
                        
                        const row = (
                          <tr 
                            key={`${categoryIndex}-${kpiIndex}-${platformIndex}`}
                            style={{
                              // Category divider (darker) - only at the bottom of last row in category
                              borderBottom: isLastRowInCategory && categoryIndex < groupedData.length - 1 
                                ? '3px solid #d1d5db' 
                                : isLastRowInKPI && !isLastRowInCategory 
                                  ? '1px solid #e5e7eb'  // KPI divider (lighter)
                                  : '1px solid #f3f4f6', // Normal row divider
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                          >
                            {/* Category - Show only once per category */}
                            {isFirstRowInCategory && (
                              <td 
                                rowSpan={categoryRowCount}
                                style={{
                                  padding: '16px 20px',
                                  fontSize: '0.9rem',
                                  color: '#1f2937',
                                  fontWeight: '700',
                                  backgroundColor: '#f8fafc',
                                  borderRight: '2px solid #e5e7eb',
                                  verticalAlign: 'top'
                                }}
                              >
                                {categoryData.categoryName}
                              </td>
                            )}

                            {/* KPI & Platform - Show KPI name once per KPI */}
                            {isFirstRowInKPI ? (
                              <td 
                                rowSpan={kpiRowCount}
                                style={{
                                  padding: '16px 20px',
                                  fontSize: '0.875rem',
                                  verticalAlign: 'top',
                                  borderRight: isLastRowInKPI ? 'none' : '1px solid #f3f4f6'
                                }}
                              >
                                {/* KPI Name - Bold */}
                                <div style={{ 
                                  marginBottom: '12px', 
                                  fontWeight: '700', 
                                  color: '#1f2937',
                                  fontSize: '0.95rem',
                                  paddingBottom: '8px',
                                  borderBottom: '1px solid #f3f4f6'
                                }}>
                                  {kpiData.kpiName}
                                </div>
                                
                                {/* All platforms for this KPI */}
                                {kpiData.platforms.map((plt, idx) => (
                                  <div 
                                    key={idx}
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '6px',
                                      fontSize: '0.8rem',
                                      color: plt.color,
                                      marginBottom: idx < kpiData.platforms.length - 1 ? '6px' : '0',
                                      fontWeight: '500',
                                      padding: '4px 0'
                                    }}
                                  >
                                    <plt.icon size={12} color={plt.color} />
                                    <span>{plt.platform}</span>
                                  </div>
                                ))}
                              </td>
                            ) : null}

                            {/* Period 1 Value (Previous) */}
                            <td style={{
                              padding: '16px 20px',
                              textAlign: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '700',
                              color: '#166534'
                            }}>
                              {formatValue(platform.period1, platform.unit)}
                            </td>

                            {/* Period 2 Value (Recent) */}
                            <td style={{
                              padding: '16px 20px',
                              textAlign: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '700',
                              color: '#1e40af'
                            }}>
                              {formatValue(platform.period2, platform.unit)}
                            </td>

                            {/* Growth */}
                            <td style={{
                              padding: '16px 20px',
                              textAlign: 'center'
                            }}>
                              <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: '700',
                                color: formatGrowth(platform.growth).color,
                                backgroundColor: platform.growth > 0 ? '#dcfce7' : platform.growth < 0 ? '#fee2e2' : '#f3f4f6'
                              }}>
                                {getGrowthIcon(platform.growth)}
                                <span>{formatGrowth(platform.growth).text}</span>
                              </div>
                            </td>
                          </tr>
                        );

                        currentRowIndex++;
                        return row;
                      });
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && groupedData.length === 0 && dateRange1.startDate && dateRange1.endDate && dateRange2.startDate && dateRange2.endDate && (
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <BarChart3 size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#374155',
              margin: '0 0 8px 0'
            }}>
              No Comparison Data
            </h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>
              Click "Compare" to analyze your KPIs across the selected date ranges.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && groupedData.length === 0 && (!dateRange1.startDate || !dateRange1.endDate || !dateRange2.startDate || !dateRange2.endDate) && (
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <TrendingUp size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#374155',
              margin: '0 0 8px 0'
            }}>
              Ready to Compare KPIs
            </h3>
            <p style={{ color: '#6b7280', margin: '0' }}>
              Select your date ranges above and click "Compare" to analyze performance changes between periods.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIComparison;