const router = require('express').Router();
const db = require('../config/db.config');

router.get('/active', (req, res) => {
  const query = `
    SELECT EmployeeID AS id, CONCAT(FirstName, ' ', LastName) AS name, Role
    FROM employees
    WHERE IsActive = 1;
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching active employees:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;
