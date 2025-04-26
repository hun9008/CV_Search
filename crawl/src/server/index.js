require('dotenv').config();
require('module-alias/register');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('@server/routes/api');
const config = require('@config/config');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Static files (for the frontend)
app.use(express.static(path.join(__dirname, '../../public')));

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});