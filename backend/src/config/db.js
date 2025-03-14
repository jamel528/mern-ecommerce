require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Client } = require('pg');

const createDatabase = async () => {
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    });

    try {
        await client.connect();
        // Check if database exists
        const res = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`
        );

        // Create database if it doesn't exist
        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        }
    } catch (error) {
        console.error('Error creating database:', error);
        throw error;
    } finally {
        await client.end();
    }
};

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Disable logging
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const connectDB = async () => {
    try {
        await createDatabase();
        await sequelize.authenticate();
        
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
        }
        console.log('Database connected');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
