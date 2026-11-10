
const pool = require('../config/db');

// Reusable Employee Validation
const validateEmployee = (name, email, salary) => {

    // Validate Name
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return 'Name is required';
    }

    // Validate Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (typeof email !== 'string' || !emailPattern.test(email.trim())) {
        return 'Please enter a valid email';
    }

    // Validate Salary
    if (
        salary === undefined ||
        salary === null ||
        salary === '' ||
        !Number.isFinite(salary) ||
        salary <= 0
    ) {
        return 'Salary must be a positive number';
    }

    return null;
};


// Reusable ID Validation
const validateId = (id) => {
    return /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
};


// 1. INSERT Employee (POST)
const addEmployee = async (req, res) => {
    try {
        const { name, email, salary } = req.body;

        const validationError = validateEmployee(name, email, salary);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const query = `
            INSERT INTO employees (name, email, salary)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await pool.query(query, [
            name.trim(),
            email.trim(),
            salary
        ]);

        res.status(201).json({
            message: 'Employee added successfully',
            employee: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 2. GET All Employees (GET)
const getEmployees = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM employees ORDER BY id'
        );

        res.status(200).json({
            message: 'Employees retrieved successfully',
            employees: result.rows
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 2. GET All Employees (Query Parameters)
const getEmployees = async (req, res) => {
    try {
        const { id, name } = req.query;

        let query = "SELECT * FROM employees WHERE 1=1";
        let values = [];
        let count = 1;

        if (id !== undefined) {
            if (!validateId(id)) {
                return res.status(400).json({
                    message: 'Invalid employee ID'
                });
            }

            query += ` AND id = $${count++}`;
            values.push(id);
        }

        if (name !== undefined) {
            query += ` AND name = $${count++}`;
            values.push(name);
        }

        query += " ORDER BY id";

        const result = await pool.query(query, values);

        res.status(200).json({
            message: 'Employees retrieved successfully',
            employees: result.rows
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 3. GET Employee By ID (Path Parameters)
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validateId(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const result = await pool.query(
            'SELECT * FROM employees WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            message: 'Employee retrieved successfully',
            employee: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 4. UPDATE Employee (PUT)
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, salary } = req.body;

        if (!validateId(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const validationError = validateEmployee(name, email, salary);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const query = `
            UPDATE employees
            SET name = $1, email = $2, salary = $3
            WHERE id = $4
            RETURNING *
        `;

        const result = await pool.query(query, [
            name.trim(),
            email.trim(),
            salary,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            message: 'Employee updated successfully',
            employee: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// 5. UPDATE Employee (PATCH)
const patchEmployee = async (req, res) => {
    const { id } = req.params;
    const { name, email, salary } = req.body;

    // Validate employee ID
    if (!validateId(id)) {
        return res.status(400).json({
            message: 'Invalid employee ID'
        });
    }

    // Check whether at least one field is provided
    if (name === undefined && email === undefined && salary === undefined) {
        return res.status(400).json({
            message: 'Provide at least one field to update'
        });
    }

    // Validate only the fields provided
    if (name !== undefined &&
        (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({
            message: 'Invalid name'
        });
    }

    if (email !== undefined &&
        (typeof email !== 'string' ||
         !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
        return res.status(400).json({
            message: 'Please enter a valid email'
        });
    }

    if (salary !== undefined &&
        (!Number.isFinite(salary) || salary <= 0)) {
        return res.status(400).json({
            message: 'Salary must be a positive number'
        });
    }

    // Build the SQL update dynamically
    const fields = [];
    const values = [];

    if (name !== undefined) {
        values.push(name.trim());
        fields.push(`name = $${values.length}`);
    }

    if (email !== undefined) {
        values.push(email.trim());
        fields.push(`email = $${values.length}`);
    }

    if (salary !== undefined) {
        values.push(salary);
        fields.push(`salary = $${values.length}`);
    }

    values.push(id);

    const query = `
        UPDATE employees
        SET ${fields.join(', ')}
        WHERE id = $${values.length}
        RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        return res.status(404).json({
            message: 'Employee not found'
        });
    }

    res.status(200).json({
        message: 'Employee partially updated successfully',
        employee: result.rows[0]
    });
};

// 6. DELETE Employee
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validateId(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const result = await pool.query(
            'DELETE FROM employees WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            message: 'Employee deleted successfully',
            employee: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Export All Controllers
module.exports = {
    addEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    patchEmployee,
    deleteEmployee
};
