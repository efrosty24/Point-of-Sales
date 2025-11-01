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

// ===== Dashboard =====
const hourLabel = (h) => {
  const ampm = h < 12 ? 'AM' : 'PM';
  const hr = (h % 12) || 12;
  return `${hr} ${ampm}`;
};

function pCall(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

exports.getEmployeeDashboard = async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!employeeId) return res.status(400).json({ error: 'Invalid employee ID' });

  try {
    const [todayAgg, hourly, daily, monthly, recent] = await Promise.all([
      pCall(svc.getTodayAggregates, employeeId),
      pCall(svc.getHourlySalesToday, employeeId),   // devuelve hourNum, sales
      pCall(svc.getDailySalesLast7, employeeId),
      pCall(svc.getMonthlySalesLast6, employeeId),
      pCall(svc.getRecentOrders, employeeId),
    ]);

    const todaySales = Number(todayAgg?.todaySales || 0);
    const totalOrders = Number(todayAgg?.totalOrders || 0);
    const avgPerOrder = totalOrders > 0 ? Number((todaySales / totalOrders).toFixed(2)) : 0;

    const hourlySales = (hourly || []).map(r => ({
      hour: hourLabel(Number(r.hourNum)),  // usar hourNum del SQL
      sales: Number(r.sales || 0),
    }));

    const dailySales = (daily || []).map(r => ({
      day: r.day,
      sales: Number(r.sales || 0),
    }));

    const monthlySales = (monthly || []).map(r => ({
      month: r.month,
      sales: Number(r.sales || 0),
    }));

    const recentOrders = (recent || []).map(r => ({
      id: String(r.OrderID),
      date: r.DatePlaced,
      total: Number(r.Total || 0),
      status: r.Status || 'Completed',
    }));

    return res.json({
      todaySales,
      totalOrders,
      avgPerOrder,
      hourlySales,
      dailySales,
      monthlySales,
      recentOrders,
    });
  } catch (err) {
    console.error('Error in getEmployeeDashboard:', err);
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};