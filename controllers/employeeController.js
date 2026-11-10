
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
        (typeof salary !== 'number' && typeof salary !== 'string') ||
        !Number.isFinite(Number(salary)) ||
        Number(salary) <= 0
    ) {
        return 'Salary must be a positive number';
    }

    return null;
};


// Reusable ID Validation
const validateId = (id) => {
    return typeof id === 'string' &&
        /^\d+$/.test(id) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0;
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
            Number(salary)
        ]);

        res.status(201).json({
            message: 'Employee added successfully',
            employee: result.rows[0]
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
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({
                    message: 'Invalid employee name'
                });
            }

            query += ` AND name = $${count++}`;
            values.push(name.trim());
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


// 3. GET Employee By ID (Path + Query Parameters)
const getEmployeeById = async (req, res) => {
    try {
        // Path Parameter
        const { id } = req.params;

        // Query Parameters
        const { name, salary } = req.query;

        if (!validateId(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        let query = 'SELECT * FROM employees WHERE id = $1';
        let values = [id];
        let count = 2;

        // Match employee name
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({
                    message: 'Invalid employee name'
                });
            }

            query += ` AND name = $${count++}`;
            values.push(name.trim());
        }

        // Match employee salary
        if (salary !== undefined) {
            if (typeof salary !== 'string' || salary.trim() === '' ||
                !Number.isFinite(Number(salary))) {
                return res.status(400).json({
                    message: 'Invalid employee salary'
                });
            }

            query += ` AND salary = $${count++}`;
            values.push(Number(salary));
        }

        const result = await pool.query(query, values);

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
            Number(salary),
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
    try {
        const { id } = req.params;
        const { name, email, salary } = req.body;

        // Validate Employee ID
        if (!validateId(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        // Check whether at least one field is provided
        if (
            name === undefined &&
            email === undefined &&
            salary === undefined
        ) {
            return res.status(400).json({
                message: 'Provide at least one field to update'
            });
        }

        // Validate Name
        if (name !== undefined &&
            (typeof name !== 'string' || name.trim() === '')) {
            return res.status(400).json({
                message: 'Invalid name'
            });
        }

        // Validate Email
        if (email !== undefined &&
            (typeof email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
            return res.status(400).json({
                message: 'Please enter a valid email'
            });
        }

        // Validate Salary
        if (salary !== undefined &&
            (salary === null ||
            salary === '' ||
            (typeof salary !== 'number' && typeof salary !== 'string') ||
            !Number.isFinite(Number(salary)) ||
            Number(salary) <= 0)) {
            return res.status(400).json({
                message: 'Salary must be a positive number'
            });
        }

        // Build SQL Update Dynamically
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
            values.push(Number(salary));
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

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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


// EXPORT ALL CONTROLLERS
module.exports = {
    addEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    patchEmployee,
    deleteEmployee
};
