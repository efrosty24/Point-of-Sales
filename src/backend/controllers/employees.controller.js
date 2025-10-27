const svc = require('../services/employees.service');

const allowedRoles = ['Admin', 'Cashier'];

// Add employee
exports.addEmployee = (req, res) => {
  const employeeData = { ...(req.body || {}) };

  if (employeeData.Password && !employeeData.UserPassword) {
    employeeData.UserPassword = employeeData.Password;
  }

  const required = ['Email', 'FirstName', 'LastName', 'Phone', 'Role', 'UserPassword'];
  const missing = required.filter(k => !employeeData[k]);
  if (missing.length) {
    return res.status(400).json({ error: 'Missing employee data or required fields.', missing });
  }
  if (!allowedRoles.includes(employeeData.Role)) {
    return res.status(400).json({ error: 'INVALID_ROLE', allowed: allowedRoles });
  }

  svc.addEmployee(employeeData, (err, result) => {
    if (err) {
      console.error('Database error adding employee:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    return res.status(201).json({
      message: 'Employee Added',
      employee: {
        EmployeeID: result.insertId,
        Email: employeeData.Email,
        FirstName: employeeData.FirstName,
        LastName: employeeData.LastName,
        Phone: employeeData.Phone,
        Role: employeeData.Role
      },
    });
  });
};

// Get employees
exports.getEmployees = (req, res) => {
  const options = {
    employeeId: req.query.id,
    name: req.query.name,
    role: req.query.role,
    orderBy: req.query.sort,
    orderDirection: req.query.dir,
  };

  if (options.role && !allowedRoles.includes(options.role)) {
    return res.status(400).json({ error: 'INVALID_ROLE', allowed: allowedRoles });
  }

  svc.getFilteredEmployees(options, (err, rows) => {
    if (err) {
      console.error('Database error fetching employees:', err.sqlMessage || err);
      return res.status(500).json({ error: 'Failed to retrieve employee data.' });
    }

    return res.status(200).json({
      message: `${rows.length} employees found.`,
      employees: rows,
    });
  });
};

// Update employee
exports.updateEmployee = (req, res) => {
  const employeeId = req.params.id;
  const updateData = req.body || {};

  if (!employeeId) return res.status(400).json({ error: 'Employee ID is required' });
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No update data is provided' });
  }

  
  if (updateData.Password && !updateData.UserPassword) {
    updateData.UserPassword = updateData.Password;
  }
  if (updateData.Role && !allowedRoles.includes(updateData.Role)) {
    return res.status(400).json({ error: 'INVALID_ROLE', allowed: allowedRoles });
  }

  svc.updateEmployee(employeeId, updateData, (err, result) => {
    if (err && err.message && err.message.includes('No valid fields')) {
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      console.error('Error occurred updating employee:', err);
      return res.status(500).json({ error: 'Failed to update employee due to server error.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Employee with ID ${employeeId} not found` });
    }

    return res.status(200).json({
      message: `${employeeId} updated successfully`,
      updatedFields: Object.fromEntries(
        Object.entries(updateData).filter(([k]) => k !== 'UserPassword' && k !== 'Password')
      ),
    });
  });
};

// Delete employee
exports.deleteEmployee = (req, res) => {
  const employeeId = req.params.id;
  if (!employeeId) return res.status(400).json({ error: 'Employee ID is required' });

  svc.deleteEmployee(employeeId, (err, result) => {
    if (err) {
      console.error('Database error occurred deleting employee:', err);
      return res.status(500).json({ error: 'Failed to delete employee data.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Employee with ID ${employeeId} not found` });
    }
    return res.status(204).send();
  });
};