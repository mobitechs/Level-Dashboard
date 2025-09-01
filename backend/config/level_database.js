const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST2,
  user: process.env.DB_USER2,
  password: process.env.DB_PASSWORD2,
  database: process.env.DB_NAME2,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

// https://docs.google.com/document/d/11XIargUZpHc5A5OuhkJiO45KQWZXDPQm0RNCKJfP2hw/edit?tab=t.0