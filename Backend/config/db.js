const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fail fast on startup if Postgres isn't reachable, matching the previous
// Mongoose behaviour (connectDB() used to exit the process on failure).
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { prisma, connectDB };
