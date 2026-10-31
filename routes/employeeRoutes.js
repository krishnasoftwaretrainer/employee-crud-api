const express = require('express');
const router = express.Router();

const {
    addEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    patchEmployee,
    deleteEmployee
} = require('../controllers/employeeController');


router.post('/employees', addEmployee);
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.patch('/employees/:id', patchEmployee);
router.delete('/employees/:id', deleteEmployee);

module.exports = router;


