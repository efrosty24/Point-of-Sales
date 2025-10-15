import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [categories, setCategories ] = useState([]);
    const [columnCount, setColumnCount ] = useState(0);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3001/api/categories')
        .then(res => res.json())
            .then(data => {
                setCategories(data.rows);
                setColumnCount(data.columnCount);
                setLoading(false);
            })
            .catch(err => {

                console.error('Failed to fetch categories:', err);
                setLoading(false);
            });
    }, []);


  return (
    <>
        <div className="App">
            <h1>POS Application - Categories</h1>
            <p>Data is coming from Node.js which is connected to MySQL</p>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <p>Categories' columns Fetched: {columnCount} </p>
            )}
        </div>
    </>
  )
}

export default App
