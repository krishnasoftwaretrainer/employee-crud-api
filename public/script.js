
const API_URL = "http://localhost:3000/employees";

// HTML elements
const employeeId = document.getElementById("employeeId");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const salaryInput = document.getElementById("salary");

const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const getBtn = document.getElementById("getBtn");

const employeeTable = document.getElementById("employeeTable");
const message = document.getElementById("message");


// Clear form
function clearForm() {
    employeeId.value = "";
    nameInput.value = "";
    emailInput.value = "";
    salaryInput.value = "";

    saveBtn.textContent = "Create Employee";
}


// Show message
function showMessage(text) {
    message.textContent = text;
}


// CREATE and UPDATE Employee
saveBtn.addEventListener("click", async () => {

    const id = employeeId.value;

    const employee = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        salary: Number(salaryInput.value)
    };

    if (!employee.name || !employee.email || salaryInput.value === "" ||
        !Number.isFinite(employee.salary) || employee.salary <= 0) {
        showMessage("Please enter valid employee details.");
        return;
    }

    try {
        let response;

        if (id === "") {

            // POST - Create Employee
            response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(employee)
            });

        } else {

            // PUT - Update Employee
            response = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(employee)
            });

        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Operation failed");
        }

        showMessage(data.message || "Operation successful");

        clearForm();
        getEmployees();

    } catch (error) {
        showMessage(error.message);
    }

});


// GET All Employees
async function getEmployees() {

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to get employees");
        }

        employeeTable.replaceChildren();

        const employees = data.employees || [];

        employees.forEach(employee => {

            const row = document.createElement("tr");

            // Employee details
            [employee.id, employee.name, employee.email, employee.salary]
                .forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "";
                    row.appendChild(cell);
                });

            // Actions column
            const actionsCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Update";
            editButton.className = "edit-btn";

            editButton.addEventListener("click", () => {
                editEmployee(employee);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";

            deleteButton.addEventListener("click", () => {
                deleteEmployee(employee.id);
            });

            actionsCell.append(editButton, deleteButton);
            row.appendChild(actionsCell);

            employeeTable.appendChild(row);

        });

    } catch (error) {
        showMessage(error.message);
    }

}


// Load employee details into form for updating
function editEmployee(employee) {

    employeeId.value = employee.id;
    nameInput.value = employee.name;
    emailInput.value = employee.email;
    salaryInput.value = employee.salary;

    saveBtn.textContent = "Update Employee";

    showMessage("Edit employee details and click Update Employee.");
}


// DELETE Employee
async function deleteEmployee(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete employee " + id + "?"
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Delete failed");
        }

        showMessage(data.message || "Employee deleted successfully");

        getEmployees();

    } catch (error) {
        showMessage(error.message);
    }

}


// Button events
getBtn.addEventListener("click", getEmployees);

clearBtn.addEventListener("click", () => {
    clearForm();
    showMessage("");
});


// Load employees when page opens
getEmployees();
