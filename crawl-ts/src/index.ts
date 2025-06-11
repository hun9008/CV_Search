import 'dotenv/config';
import express from 'express';
import path from 'path';
import router from './router/Router';
import { swaggerUi, swaggerSpec } from './swagger/swagger';

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', router);

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
