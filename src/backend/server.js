const express = require('express');
const db = require('./config/db.config');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

app.get('/api/categories', (req, res) => {
    const query = 'SHOW COLUMNS FROM Categories';

    db.query(query, (err, results, fields) => {
        const columnCount = results ? results.length : 0;

        if (err) {
            console.error('Error executing query: ', err);
            return res.status(500).send('Error retrieving categories from database');
        }

        res.json({
            columnCount: columnCount,
            rows: results
        })
    });
});

app.listen(port, () => {
   console.log('Listening on port: ' + port);
});