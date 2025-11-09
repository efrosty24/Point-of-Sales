import axios from "axios";

const API_BASE_URL = "https://api-dot-point-of-sales-476509.uc.r.appspot.com";

//const API_BASE_URL = "http://localhost:8080";
const api = axios.create({
    baseURL: API_BASE_URL,
    // CRITICAL: This ensures cookies and authorization headers (like session IDs
    // or CSRF tokens) are sent with cross-origin requests.
    withCredentials: true,
    // Add a default timeout to prevent indefinite hangs
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;