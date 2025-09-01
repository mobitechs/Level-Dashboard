const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.qrCodeData = null;
    this.status = 'disconnected';
  }

  async initialize() {
    try {
      this.status = 'connecting';
      console.log('Initializing WhatsApp client...');
      
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      this.client.on('qr', async (qr) => {
        console.log('QR Code received, generating image...');
        try {
          // Generate QR code as base64 image
          this.qrCodeData = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          console.log('QR Code generated successfully');
          console.log('QR Code length:', this.qrCodeData ? this.qrCodeData.length : 'null');
          
          // Also display in terminal for debugging
          qrcode.generate(qr, { small: true });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      });

      this.client.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        this.isConnected = true;
        this.status = 'connected';
        this.qrCodeData = null; // Clear QR code when connected
      });

      this.client.on('disconnected', (reason) => {
        console.log('WhatsApp Client disconnected:', reason);
        this.isConnected = false;
        this.status = 'disconnected';
        this.qrCodeData = null;
      });

      this.client.on('auth_failure', (message) => {
        console.log('WhatsApp authentication failed:', message);
        this.status = 'error';
        this.qrCodeData = null;
      });

      await this.client.initialize();
      return { success: true, message: 'WhatsApp initialization started' };
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
      this.status = 'error';
      return { success: false, message: error.message };
    }
  }

  async sendBulkMessages(phoneNumbers, message) {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const results = {
      sent: 0,
      failed: 0,
      logs: []
    };

    for (const number of phoneNumbers) {
      try {
        const chatId = number + "@c.us";
        await this.client.sendMessage(chatId, message);
        results.sent++;
        results.logs.push(`✅ Message sent to ${number}`);
        console.log(`Message sent to ${number}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.failed++;
        results.logs.push(`❌ Failed to send to ${number}: ${error.message}`);
        console.error(`Failed to send to ${number}:`, error);
      }
    }

    return results;
  }

  getStatus() {
    console.log('Current status:', {
      status: this.status,
      isConnected: this.isConnected,
      hasQrCode: !!this.qrCodeData
    });

    return {
      status: this.status,
      isConnected: this.isConnected,
      qrCode: this.qrCodeData // Return full data URL
    };
  }

  disconnect() {
    if (this.client) {
      this.client.destroy();
      this.isConnected = false;
      this.status = 'disconnected';
      this.qrCodeData = null;
    }
  }
}

module.exports = WhatsAppService;