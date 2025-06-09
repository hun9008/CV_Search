import 'dotenv/config';
import express from 'express'
import path from 'path';
import jobRouter from './routes/jobRouter';

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

app.use('/api',jobRouter);


// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});