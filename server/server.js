require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const multer = require("multer");
const path = require("path");

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const chatbotRoutes = require('./routes/chatbot');
const uploadRoutes = require('./routes/uploadRoutes');
const app = express();

const allowedClientOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedClientOrigins.length === 0 || allowedClientOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by CORS'));
    },
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get('/', (req, res) => {
    res.send("Hello from Server");
  });
  
  
app.use('/api/auth', authRoutes);
app.use('/api', contactRoutes);
app.use('/api/clerk', complaintRoutes)
app.use('/api/chatbot', chatbotRoutes);
app.use("/api/upload", uploadRoutes);

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to the database:", err);
  });

