require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Successfully connected to MongoDB!'))
.catch((err) => console.error('Error connecting to MongoDB:', err));

// --- API ROUTES ---

// Import Route Handlers Make sure to implement these
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes); // e.g. /api/locations, /api/turfs

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
