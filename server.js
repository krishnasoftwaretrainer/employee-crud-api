
const express = require('express');
const pool = require('./config/db');

const app = express();

// Middleware
app.use(express.json());

// Serve HTML, CSS and JavaScript
app.use(express.static('public'));

// Create Employee Table
app.get('/create-table', async (req, res) => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100),
                salary NUMERIC(10,2)
            )
        `;

        await pool.query(query);

        res.send('Employee table created successfully!');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Employee Routes
const employeeRoutes = require('./routes/employeeRoutes');
app.use(employeeRoutes);

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
