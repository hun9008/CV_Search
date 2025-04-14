"use strict";
require('dotenv').config();
require('module-alias/register');
var express = require('express');
var cors = require('cors');
var morgan = require('morgan');
var path = require('path');
var routes = require('@server/routes/api');
var config = require('@config/config');
// Initialize express app
var app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging
// Static files (for the frontend)
app.use(express.static(path.join(__dirname, '../../public')));
// API Routes
app.use('/api', routes);
// Error handling middleware
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});
// Start server
var PORT = process.env.SERVER_PORT;
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
