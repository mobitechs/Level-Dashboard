const express = require('express');
const cors = require('cors');
require('dotenv').config();

const whatsappRoutes = require('./routes/whatsapp');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/kpis', require('./routes/kpi'));
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KPI Dashboard API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});