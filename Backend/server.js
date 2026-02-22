const dotenv = require('dotenv');
// Load env vars first
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

// Connect to Database
// Connect to Database
connectDB();

console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('ENCRYPTION_KEY loaded:', !!process.env.ENCRYPTION_KEY);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
