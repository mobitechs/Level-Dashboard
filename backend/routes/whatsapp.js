const express = require('express');
const WhatsAppService = require('../services/WhatsAppService');

const router = express.Router();
const whatsappService = new WhatsAppService();

// Initialize WhatsApp connection
router.post('/initialize', async (req, res) => {
  try {
    console.log('Initialize WhatsApp endpoint called');
    const result = await whatsappService.initialize();
    console.log('Initialize result:', result);
    res.json(result);
  } catch (error) {
    console.error('Initialize error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get connection status
router.get('/status', (req, res) => {
  try {
    console.log('Status endpoint called');
    const status = whatsappService.getStatus();
    console.log('Returning status:', status);
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send bulk messages
router.post('/send-bulk', async (req, res) => {
  try {
    const { message, phoneNumbers } = req.body;
    
    if (!message || !phoneNumbers || phoneNumbers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message and phone numbers are required' 
      });
    }

    console.log('Sending bulk messages to:', phoneNumbers.length, 'numbers');
    const results = await whatsappService.sendBulkMessages(phoneNumbers, message);
    res.json({ success: true, ...results });
  } catch (error) {
    console.error('Send bulk error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Disconnect WhatsApp
router.post('/disconnect', (req, res) => {
  try {
    whatsappService.disconnect();
    res.json({ success: true, message: 'WhatsApp disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;