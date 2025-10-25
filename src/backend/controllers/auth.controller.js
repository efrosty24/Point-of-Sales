
const svc = require('../services/auth.service');

// POST /api/login
exports.login = (req, res) => {
  const { employeeId, password } = req.body || {};
  if (!employeeId || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  svc.findEmployeeById(employeeId, (err, user) => {
    if (err) {
      console.error('[login] DB error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!user || !svc.verifyPassword(user, password)) {
      return res.json({ success: false, message: 'InvalidUP' });
    }

    const isAdmin = svc.computeIsAdmin(user);
    const route = isAdmin ? '/admin' : '/cashier';

    return res.json({
      success: true,
      message: 'Login successful',
      employee: {
        id: user.EmployeeID,
        name: `${user.FirstName} ${user.LastName}`,
        role: user.Role,
        isAdmin
      },
      route
    });
  });
};

// GET /api/auth/role?employeeId=123
exports.getRole = (req, res) => {
  const employeeId = req.query.employeeId;
  if (!employeeId) return res.status(400).json({ error: 'MISSING_EMPLOYEE_ID' });

  svc.findEmployeeById(employeeId, (err, user) => {
    if (err) {
      console.error('[getRole] DB error:', err);
      return res.status(500).json({ error: 'DB_ERROR' });
    }
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' });

    const isAdmin = svc.computeIsAdmin(user);
    return res.json({
      id: user.EmployeeID,
      role: user.Role,
      isAdmin
    });
  });
};