import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Users,
  Send,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
  Smartphone,
  FileText,
  Clock,
  RefreshCw,
  QrCode,
  Wifi,
  WifiOff
} from 'lucide-react';

const WhatsAppMessaging = ({ onBack, showBackButton = true }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bulkMessage, setBulkMessage] = useState({
    message: '',
    phoneNumbers: '',
    template: 'custom'
  });
  const [sendingStatus, setSendingStatus] = useState({
    inProgress: false,
    sent: 0,
    failed: 0,
    total: 0,
    logs: []
  });
  const [messageTemplates, setMessageTemplates] = useState([
    {
      id: 'welcome',
      name: 'Welcome Message',
      content: 'Hello! Welcome to our service. We\'re excited to have you on board!'
    },
    {
      id: 'promotion',
      name: 'Promotional Message',
      content: 'Special offer just for you! Get 20% off your next purchase. Use code: SAVE20'
    },
    {
      id: 'reminder',
      name: 'Payment Reminder',
      content: 'This is a friendly reminder about your upcoming payment. Please ensure your account is funded.'
    },
    {
      id: 'custom',
      name: 'Custom Message',
      content: ''
    }
  ]);

  // FIXED: Define API base URL - adjust this to match your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // FIXED: Correct API call
  const checkConnectionStatus = async () => {
    try {
      console.log('Checking WhatsApp connection status...');
      const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Status response:', data);
      
      if (data.success) {
        setConnectionStatus(data.status || 'disconnected');
        if (data.qrCode) {
          setQrCode(data.qrCode);
        }
      } else {
        setConnectionStatus('error');
        showMessage('error', data.message || 'Failed to get connection status');
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setConnectionStatus('error');
      showMessage('error', `Cannot connect to backend: ${error.message}`);
    }
  };

  // FIXED: Correct API call with better error handling
  const initializeWhatsApp = async () => {
    try {
      setConnectionStatus('connecting');
      showMessage('info', 'Initializing WhatsApp connection...');
      
      console.log('Initializing WhatsApp...');
      const response = await fetch(`${API_BASE_URL}/whatsapp/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Initialize response:', data);
      
      if (data.success) {
        if (data.qrCode) {
          setQrCode(data.qrCode);
          showMessage('info', 'Scan the QR code with WhatsApp on your phone');
        }
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE_URL}/whatsapp/status`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log('Poll status:', statusData);
              
              if (statusData.status === 'connected') {
                setConnectionStatus('connected');
                setQrCode(''); // Clear QR code when connected
                clearInterval(pollInterval);
                showMessage('success', 'WhatsApp connected successfully!');
              } else if (statusData.status === 'error') {
                setConnectionStatus('error');
                clearInterval(pollInterval);
                showMessage('error', 'Failed to connect to WhatsApp');
              }
            }
          } catch (pollError) {
            console.error('Error polling status:', pollError);
          }
        }, 3000); // Poll every 3 seconds
        
        // Clear interval after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (connectionStatus === 'connecting') {
            setConnectionStatus('error');
            showMessage('error', 'Connection timeout. Please try again.');
          }
        }, 120000);
        
      } else {
        setConnectionStatus('error');
        showMessage('error', data.message || 'Failed to initialize WhatsApp');
      }
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      setConnectionStatus('error');
      showMessage('error', `Failed to initialize: ${error.message}`);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = messageTemplates.find(t => t.id === templateId);
    setBulkMessage(prev => ({
      ...prev,
      template: templateId,
      message: template ? template.content : ''
    }));
  };

  const processPhoneNumbers = (numbersText) => {
    return numbersText
      .split(/[,\n\r\s]+/)
      .map(num => num.trim())
      .filter(num => num.length > 0)
      .map(num => {
        // Add country code if not present
        if (!num.startsWith('+') && !num.startsWith('91')) {
          return '91' + num; // Default to India country code
        }
        return num.replace('+', '');
      });
  };

  // FIXED: Correct API call for sending messages
  const sendBulkMessages = async () => {
    if (!bulkMessage.message.trim()) {
      showMessage('error', 'Please enter a message to send');
      return;
    }
    
    if (!bulkMessage.phoneNumbers.trim()) {
      showMessage('error', 'Please enter phone numbers');
      return;
    }
    
    const phoneNumbers = processPhoneNumbers(bulkMessage.phoneNumbers);
    
    if (phoneNumbers.length === 0) {
      showMessage('error', 'No valid phone numbers found');
      return;
    }

    try {
      setSendingStatus({
        inProgress: true,
        sent: 0,
        failed: 0,
        total: phoneNumbers.length,
        logs: []
      });

      console.log('Sending bulk messages...', { phoneNumbers, message: bulkMessage.message });
      
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: bulkMessage.message,
          phoneNumbers: phoneNumbers
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Send response:', data);
      
      if (data.success) {
        setSendingStatus(prev => ({
          ...prev,
          inProgress: false,
          sent: data.sent || 0,
          failed: data.failed || 0,
          logs: data.logs || []
        }));
        
        showMessage('success', `Messages sent! Sent: ${data.sent}, Failed: ${data.failed}`);
      } else {
        setSendingStatus(prev => ({ ...prev, inProgress: false }));
        showMessage('error', data.message || 'Failed to send messages');
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      setSendingStatus(prev => ({ ...prev, inProgress: false }));
      showMessage('error', `Error sending messages: ${error.message}`);
    }
  };

  const uploadCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n');
      const phoneNumbers = [];
      
      lines.forEach(line => {
        const columns = line.split(',');
        if (columns[0] && columns[0].trim()) {
          phoneNumbers.push(columns[0].trim());
        }
      });
      
      setBulkMessage(prev => ({
        ...prev,
        phoneNumbers: phoneNumbers.join('\n')
      }));
      
      showMessage('success', `Imported ${phoneNumbers.length} phone numbers from CSV`);
    };
    
    reader.readAsText(file);
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi size={16} style={{ color: '#10b981' }} />,
          text: 'Connected',
          color: '#10b981'
        };
      case 'connecting':
        return {
          icon: <RefreshCw size={16} style={{ color: '#f59e0b' }} className="animate-spin" />,
          text: 'Connecting...',
          color: '#f59e0b'
        };
      case 'error':
        return {
          icon: <WifiOff size={16} style={{ color: '#ef4444' }} />,
          text: 'Connection Error',
          color: '#ef4444'
        };
      default:
        return {
          icon: <WifiOff size={16} style={{ color: '#6b7280' }} />,
          text: 'Disconnected',
          color: '#6b7280'
        };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      padding: showBackButton ? '16px' : '0'
    }}>
      {/* Back button */}
      {showBackButton && onBack && (
        <div style={{ paddingBottom: '16px', flexShrink: 0 }}>
          <button 
            onClick={onBack}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Message Display */}
      {message.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '6px',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : message.type === 'info' ? '#bfdbfe' : '#bbf7d0'}`,
          background: message.type === 'error' ? '#fef2f2' : message.type === 'info' ? '#eff6ff' : '#f0fdf4',
          color: message.type === 'error' ? '#dc2626' : message.type === 'info' ? '#2563eb' : '#16a34a',
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: connectionStatus === 'connected' ? '1fr' : '1fr 300px',
        gap: '24px', 
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          overflow: 'hidden'
        }}>
          {/* Connection Status Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={20} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>WhatsApp Connection</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {connectionDisplay.icon}
                  <span style={{ color: connectionDisplay.color, fontWeight: '500' }}>
                    {connectionDisplay.text}
                  </span>
                </div>
                
                {connectionStatus !== 'connected' && (
                  <button 
                    onClick={initializeWhatsApp}
                    disabled={connectionStatus === 'connecting'}
                    className="btn-primary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect WhatsApp'}
                  </button>
                )}

                {/* NEW: Add refresh button for debugging */}
                <button 
                  onClick={checkConnectionStatus}
                  className="btn-secondary"
                  style={{ fontSize: '0.875rem' }}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Rest of your existing JSX remains the same... */}
          {/* Bulk Messaging Form */}
          {connectionStatus === 'connected' && (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} />
                Send Bulk Messages
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>
                {/* Message Template Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374155', marginBottom: '8px' }}>
                    Message Template
                  </label>
                  <select
                    value={bulkMessage.template}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {messageTemplates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                {/* Message Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374155', marginBottom: '8px' }}>
                    Message Content
                  </label>
                  <textarea
                    value={bulkMessage.message}
                    onChange={(e) => setBulkMessage(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your message here..."
                    style={{
                      flex: 1,
                      minHeight: '100px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Phone Numbers Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374155' }}>
                      Phone Numbers (one per line)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={uploadCSV}
                        style={{ display: 'none' }}
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>Import CSV</span>
                      </label>
                    </div>
                  </div>
                  <textarea
                    value={bulkMessage.phoneNumbers}
                    onChange={(e) => setBulkMessage(prev => ({ ...prev, phoneNumbers: e.target.value }))}
                    placeholder="Enter phone numbers (one per line)&#10;Example:&#10;9123456789&#10;9198765432&#10;+919876543210"
                    style={{
                      flex: 1,
                      minHeight: '120px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={sendBulkMessages}
                  disabled={sendingStatus.inProgress}
                  className="btn-primary"
                  style={{ 
                    alignSelf: 'flex-start',
                    opacity: sendingStatus.inProgress ? 0.6 : 1
                  }}
                >
                  {sendingStatus.inProgress ? (
                    <>
                      <div className="loading-spinner" style={{ width: '14px', height: '14px' }}></div>
                      <span>Sending... ({sendingStatus.sent}/{sendingStatus.total})</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Messages</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QR Code / Connection Instructions */}
        {connectionStatus !== 'connected' && (
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '16px'
          }}>
            {qrCode ? (
              <>
                <QrCode size={48} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                  Scan QR Code
                </h3>
                <div style={{
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0'
                }}>
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="WhatsApp QR Code"
                    style={{ width: '200px', height: '200px' }}
                  />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '250px' }}>
                  <p>1. Open WhatsApp on your phone</p>
                  <p>2. Go to Settings &gt; Linked Devices</p>
                  <p>3. Tap "Link a Device"</p>
                  <p>4. Scan this QR code</p>
                </div>
              </>
            ) : (
              <>
                <Smartphone size={48} style={{ color: '#6b7280' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                  Connect Your WhatsApp
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Click "Connect WhatsApp" to start the authentication process
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sending Status/Logs */}
      {(sendingStatus.sent > 0 || sendingStatus.failed > 0 || sendingStatus.logs.length > 0) && (
        <div style={{
          marginTop: '16px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          flexShrink: 0
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>
            Sending Results
          </h4>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.875rem' }}>Sent: {sendingStatus.sent}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.875rem' }}>Failed: {sendingStatus.failed}</span>
            </div>
          </div>
          
          {sendingStatus.logs.length > 0 && (
            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              background: '#f8fafc',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}>
              {sendingStatus.logs.map((log, index) => (
                <div key={index} style={{ 
                  color: log.includes('✅') ? '#10b981' : log.includes('❌') ? '#ef4444' : '#6b7280' 
                }}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessaging;