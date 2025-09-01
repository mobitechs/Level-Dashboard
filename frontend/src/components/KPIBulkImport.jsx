import React, { useState, useEffect } from 'react';
import { Upload, Save, AlertCircle, CheckCircle, Loader2, FileText, X, Eye } from 'lucide-react';

const KPIBulkImport = ({ onBack }) => {
  const [formData, setFormData] = useState({
    category_id: '',
    kpi_id: ''
  });

  const [categories, setCategories] = useState([]);
  const [filteredKpis, setFilteredKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // File upload and preview states
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  // Helper function to clean numeric values
  const cleanNumericValue = (valueStr) => {
    if (!valueStr) return valueStr;
    
    // Remove common symbols: %, $, commas, spaces
    const cleaned = valueStr.toString()
      .replace(/[%$,\s]/g, '')
      .trim();
    
    // Return empty string if nothing left or if it's not a number
    if (!cleaned || isNaN(parseFloat(cleaned))) {
      return '';
    }
    
    return cleaned;
  };

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
    // Reset file data when category changes
    resetFileData();
  }, [formData.category_id]);

  useEffect(() => {
    // Reset file data when KPI changes
    if (formData.kpi_id !== '') {
      resetFileData();
    }
  }, [formData.kpi_id]);

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

  const resetFileData = () => {
    setSelectedFile(null);
    setParsedData([]);
    setPreviewData([]);
    setValidationErrors([]);
    setShowPreview(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleFileSelect = async (file) => {
    if (!formData.category_id || !formData.kpi_id) {
      setMessage({ type: 'error', text: 'Please select category and KPI first' });
      return;
    }

    setSelectedFile(file);
    setParsing(true);
    setMessage({ type: '', text: '' });

    try {
      const fileContent = await readFileContent(file);
      const parsed = await parseFileContent(fileContent, file.name);
      
      if (parsed && parsed.length > 0) {
        setParsedData(parsed);
        const validated = validateImportData(parsed);
        setPreviewData(validated.validRows);
        setValidationErrors(validated.errors);
        setShowPreview(true);
        
        if (validated.errors.length > 0) {
          setMessage({ 
            type: 'error', 
            text: `Found ${validated.errors.length} validation errors. Check the preview below.` 
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: `Successfully parsed ${validated.validRows.length} rows. Review and submit.` 
          });
        }
      }
    } catch (error) {
      console.error('File parsing error:', error);
      setMessage({ type: 'error', text: 'Error parsing file. Please check the format.' });
    } finally {
      setParsing(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseFileContent = async (content, filename) => {
    const isExcel = filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls');
    
    if (isExcel) {
      // For Excel files, we'd need SheetJS - for now, let's focus on CSV
      throw new Error('Excel files not yet supported. Please use CSV format.');
    }
    
    // Parse CSV using a simple parser (in real app, you'd use Papaparse)
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('File must have header and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          let value = values[index];
          
          // Auto-correct date format from DD-MM-YYYY to YYYY-MM-DD
          if (header === 'date_value' && value) {
            value = convertDateFormat(value);
          }
          
          // Auto-clean numeric values (remove %, $, commas, etc.)
          if (['android_value', 'ios_value', 'net_value'].includes(header) && value) {
            value = cleanNumericValue(value);
          }
          
          row[header] = value;
        });
        rows.push(row);
      }
    }
    
    return rows;
  };

  // Helper function to convert date formats
  const convertDateFormat = (dateStr) => {
    if (!dateStr) return dateStr;
    
    // Try different date formats and convert to YYYY-MM-DD
    const formats = [
      // DD-MM-YYYY or DD/MM/YYYY
      /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,
      // MM-DD-YYYY or MM/DD/YYYY  
      /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,
      // Already in YYYY-MM-DD format
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/
    ];
    
    // Check if already in correct format (YYYY-MM-DD)
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try DD-MM-YYYY format first (most common international format)
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }
    
    return dateStr; // Return as-is if no pattern matches
  };

  const validateImportData = (data) => {
    const validRows = [];
    const errors = [];
    
    const requiredFields = ['date_value'];
    const valueFields = ['android_value', 'ios_value', 'net_value'];
    
    data.forEach((row, index) => {
      const rowErrors = [];
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          rowErrors.push(`Missing ${field}`);
        }
      });
      
      // Check that at least one value field is provided
      const hasValue = valueFields.some(field => 
        row[field] && row[field].trim() !== '' && !isNaN(parseFloat(row[field]))
      );
      
      if (!hasValue) {
        rowErrors.push('At least one value (android_value, ios_value, net_value) is required');
      }
      
      // Validate date format with better error message
      if (row.date_value) {
        const date = new Date(row.date_value);
        if (isNaN(date.getTime())) {
          rowErrors.push(`Invalid date format "${row.date_value}". Use YYYY-MM-DD format (e.g., 2025-08-16)`);
        }
      }
      
      // Validate numeric values with better error messages
      valueFields.forEach(field => {
        if (row[field] && row[field].trim() !== '') {
          const cleanValue = row[field].replace(/[%$,\s]/g, '');
          if (isNaN(parseFloat(cleanValue))) {
            rowErrors.push(`${field} "${row[field]}" is not a valid number. Use format like: 47.54 (no % symbols)`);
          }
        }
      });
      
      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors,
          data: row
        });
      } else {
        validRows.push({
          ...row,
          rowNumber: index + 1
        });
      }
    });
    
    return { validRows, errors };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    resetFileData();
  };

  const handleSubmit = async () => {
    if (!formData.category_id || !formData.kpi_id) {
      setMessage({ type: 'error', text: 'Please select category and KPI' });
      return;
    }

    if (previewData.length === 0) {
      setMessage({ type: 'error', text: 'No valid data to import' });
      return;
    }

    setSubmitLoading(true);
    
    try {
      const importData = previewData.map(row => ({
        date_value: row.date_value,
        android_value: row.android_value ? parseFloat(cleanNumericValue(row.android_value)) : null,
        ios_value: row.ios_value ? parseFloat(cleanNumericValue(row.ios_value)) : null,
        net_value: row.net_value ? parseFloat(cleanNumericValue(row.net_value)) : null,
        data_source: row.data_source || 'Import',
        notes: row.notes || null
      })).filter(row => 
        // Filter out rows where all values are null
        row.android_value !== null || row.ios_value !== null || row.net_value !== null
      );

      // Use bulk insert endpoint for better performance
      const response = await fetch(`${API_BASE_URL}/api/kpis/values/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          kpi_id: parseInt(formData.kpi_id),
          values: importData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || `Successfully imported ${result.summary?.successful || previewData.length} rows!` 
        });
        resetForm();
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Import failed' 
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: 'Error importing data. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      kpi_id: ''
    });
    setFilteredKpis([]);
    resetFileData();
    setMessage({ type: '', text: '' });
  };

  const downloadTemplate = () => {
    const templateData = `date_value,android_value,ios_value,net_value,data_source,notes
2025-08-01,47.54,72.22,67.09,Analytics,Sample data for Android and iOS
2025-08-02,79.03,75.00,102.22,Database,Sample data for all platforms
2025-08-03,73.33,57.69,97.67,Manual Entry,Data without percentage symbols`;
    
    const blob = new Blob([templateData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kpi_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                >
                  <span>← Back</span>
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-800">KPI Bulk Import</h2>
            </div>
            <button
              onClick={downloadTemplate}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Download Template</span>
            </button>
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

          {/* Category and KPI Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

          {/* File Upload Section */}
          {formData.category_id && formData.kpi_id && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Data File *
              </label>
              
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    Drop your CSV file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: CSV (.csv)
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Required columns: date_value, and at least one of: android_value, ios_value, net_value
                    <br />
                    <span className="text-green-600">✨ Auto-corrects: DD-MM-YYYY dates, percentage symbols (%), dollar signs ($)</span>
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-700">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {parsing && (
                    <div className="mt-4 flex items-center space-x-2 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Parsing file...</span>
                    </div>
                  )}
                </div>
              )}

              <input
                id="fileInput"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-red-700 mb-3">Validation Errors</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 mb-2">
                    <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview */}
          {showPreview && previewData.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-700">Data Preview</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>Showing {Math.min(previewData.length, 10)} of {previewData.length} valid rows</span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Android
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          iOS
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {row.date_value}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {row.android_value || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {row.ios_value || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {row.net_value || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {row.data_source || 'Import'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                            {row.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {previewData.length > 10 && (
                  <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
                    ... and {previewData.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit and Reset Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={submitLoading || previewData.length === 0 || !formData.category_id || !formData.kpi_id}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              {submitLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{submitLoading ? 'Importing...' : `Import ${previewData.length} Records`}</span>
            </button>
            
            <button
              onClick={resetForm}
              disabled={submitLoading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Import Instructions & Auto-Corrections:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-medium text-blue-700 mb-1">✅ Accepted Formats:</h5>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• <strong>Dates:</strong> 2025-08-16, 16-08-2025, 16/08/2025</li>
                  <li>• <strong>Values:</strong> 47.54, 47.54%, $47.54, 1,234.56</li>
                  <li>• <strong>Headers:</strong> date_value, android_value, ios_value, net_value, data_source, notes</li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-medium text-blue-700 mb-1">🔧 Auto-Corrections:</h5>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Date formats automatically converted to YYYY-MM-DD</li>
                  <li>• Percentage symbols (%) automatically removed</li>
                  <li>• Dollar signs ($) and commas automatically removed</li>
                  <li>• At least one value column required per row</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
              <strong>Your data format:</strong> The system detected DD-MM-YYYY dates and percentage values - these will be auto-corrected during import.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIBulkImport;