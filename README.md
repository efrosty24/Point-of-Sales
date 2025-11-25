#  Full-Stack POS Application

## Table of Contents
* [Technologies Used](#Technologies-Used)
* [Prerequisites](#Prerequisites)
* [Initial Setup & Database Import](#Initial-Setup-&-Database-Import)
* [Running the Application](#Running-the-Application)
* [Backend README](src/backend/README.md)

## Technologies Used

* **Frontend:** React (Scaffolded with Vite)
* **Backend:** Node.js 
* **Database:** MySQL Server (Version 9.4.0)
* **Database Tool:** MySQL Workbench

---

## Prerequisites

Before starting the application, ensure you have the following software installed:

1.  **Node.js & npm:** (Globally installed)
2.  **MySQL Server:** (Running locally on port 3306)
3.  **MySQL Workbench:** (Used for initial database setup)

---

## Initial Setup & Database Import

Follow these steps to prepare your environment and load the database schema.

### 1. Database Setup

1.  **Import Schema:** Using MySQL Workbench, import the provided SQL dump file.
    * **File:** `posdb.sql`
    * **Action:** Ensure the `posdb` schema exists and is selected before running the import.

### 2. Project Installation

1.  **Root Directory:** Open your terminal in the project's root folder.
2.  **Install Backend Dependencies:**
    ```bash
    cd src/backend
    npm install
    ```
3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

### 3. Environment Configuration

The backend connects to the database using credentials.

1.  **Create an Environment File:** In the `src/backend` directory, create a new file named **`.env`**.
2.  **Add Credentials:** Add your MySQL connection details to this file (This assumes you updated your `db.config.js` to read these variables):
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=YOUR_ROOT_PASSWORD_HERE  # <-- CHANGE THIS!
    DB_NAME=posdb
    GUEST_CUSTOMER_ID=1000
    ```

---

## Running the Application

The frontend and backend must be run simultaneously in two separate terminal windows.

### 1. Start the Backend (Server)

1.  Open **Terminal 1**.
2.  Navigate to the backend folder:
    ```bash
    cd src/backend
    ```
3.  Run the server:
    ```bash
    npm start 
    ```
    (The server should report that it is listening on port **8080**.)

### 2. Start the Frontend (Client)

1.  Open **Terminal 2**.
2.  Navigate to the frontend folder:
    ```bash
    cd src/frontend
    ```
3.  Run the React development server:
    ```bash
    npm run dev
    ```

---
