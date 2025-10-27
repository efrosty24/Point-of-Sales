const db = require('../config/db.config');

// INSERT
exports.addEmployee = (employeeData, callback) => {
  const sql = `
    INSERT INTO Employees (
      Email,
      FirstName,
      LastName,
      Phone,
      Role,
      UserPassword
    ) VALUES (?, ?, ?, ?, ?, ?);
  `;
  const values = [
    employeeData.Email,
    employeeData.FirstName,
    employeeData.LastName,
    employeeData.Phone,
    employeeData.Role,        
    employeeData.UserPassword 
  ];
  db.query(sql, values, callback);
};

exports.getFilteredEmployees = (options, callback) => {
  let sql = `
    SELECT
      EmployeeID,
      FirstName,
      LastName,
      Email,
      Phone,
      Role
    FROM Employees
  `;
  const filters = [];
  const values = [];

  if (options.employeeId) { filters.push('EmployeeID = ?'); values.push(options.employeeId); }
  if (options.name) { const t = `%${options.name}%`; filters.push('(FirstName LIKE ? OR LastName LIKE ?)'); values.push(t, t); }
  if (options.role) { filters.push('Role = ?'); values.push(options.role); }

  if (filters.length) sql += ' WHERE ' + filters.join(' AND ');

  let orderBy = 'EmployeeID';
  let orderDirection = 'ASC';
  if (options.orderBy) {
    switch (options.orderBy.toLowerCase()) {
      case 'name': orderBy = 'LastName'; break;
      case 'id':   orderBy = 'EmployeeID'; break;
      case 'role': orderBy = 'Role'; break;
    }
  }
  if (options.orderDirection && options.orderDirection.toUpperCase() === 'DESC') {
    orderDirection = 'DESC';
  }

  sql += ` ORDER BY ${orderBy} ${orderDirection};`;
  db.query(sql, values, callback);
};

// UPDATE
exports.updateEmployee = (employeeId, employeeData, callback) => {
  const setClauses = [];
  const values = [];
  const allowed = ['FirstName', 'LastName', 'Email', 'Phone', 'Role', 'UserPassword'];

  for (const key of allowed) {
    if (employeeData[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(employeeData[key]);
    }
  }
  if (!setClauses.length) return callback(new Error('No valid fields provided for update.'), null);

  const sql = `UPDATE Employees SET ${setClauses.join(', ')} WHERE EmployeeID = ?;`;
  values.push(employeeId);
  db.query(sql, values, callback);
};

// DELETE
exports.deleteEmployee = (employeeId, callback) => {
  const sql = `DELETE FROM Employees WHERE EmployeeID = ?;`;
  db.query(sql, [employeeId], callback);
};