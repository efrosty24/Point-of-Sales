import { useState } from "react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("customers");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), type);
  };

  // Map type to specific placeholder text
  const placeholderMap = {
    customers: "Enter CustomerID...",
    orders: "Enter OrderID...",
    products: "Enter ProductID..."
  };

  return (
    <form
      onSubmit={handleSearch}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "30px",
        padding: "10px 15px",
        borderRadius: "12px",
        backgroundColor: "#f5f6fa",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        maxWidth: "700px",
        margin: "0 auto"
      }}
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "14px",
          backgroundColor: "#fff",
          cursor: "pointer"
        }}
      >
        <option value="customers">Customers</option>
        <option value="orders">Orders</option>
        <option value="products">Products</option>
      </select>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholderMap[type]} // updated placeholder
        style={{
          flexGrow: 1,
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "14px"
        }}
      />

      <button
        type="submit"
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#4CAF50",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "background-color 0.3s"
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#45a049")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4CAF50")}
      >
        Search
      </button>
    </form>
  );
}

export default SearchBar;
