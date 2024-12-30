const express = require("express");
require('dotenv').config();
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/authRoutes");
const adminRouter = require("./routes/adminRoutes");
const inventoryRouter = require("./routes/inventoryRoutes");
const profileRouter = require("./routes/profileRoutes");
const mongodb = require("./utils/mongodb");
const path = require("path"); // Added for path handling

const app = express();

// Define Allowed Origins without Trailing Slashes
const allowedOrigins = [
    'http://localhost:5173',
    "https://management-system-dun.vercel.app",
];

// CORS Configuration
const corsOptions = {
    origin: allowedOrigins, // Use the corrected origins
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

// Apply CORS Middleware first
app.use(cors(corsOptions));

// Initialize MongoDB Connection
mongodb;

// Apply Security and Parsing Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use("/logo", express.static(path.join(__dirname, "middlewares/logo")));

// Define Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/profile', profileRouter);

// Test Routes
app.get('/checking', (req, res) => {
    res.json({ message: "I am deployed" });
});

app.get('/', (req, res) => {      
    console.log(process.env.NODE_ENV);
    const mongoURI = process.env.MONGO_URI || 'Not Defined'; // Ensure mongoURI is defined
    res.json({ message: "Bye from the server.", mongoURI });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof Error && err.message.includes('CORS')) {
        res.status(403).json({ message: err.message });
    } else {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
