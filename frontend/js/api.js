// ==========================================================
// API.JS — communication with the FastAPI backend
// ==========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const API = {

  async register(username, email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Registration failed.");
    }

    return data;
  },


  async login(username, password) {
    const body = new URLSearchParams();

    body.append("username", username);
    body.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed.");
    }

    return data;
  },


  async getCurrentUser(token) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not retrieve current user.");
    }

    return data;
  },


  async getDashboard(token) {
    const response = await fetch(`${API_BASE_URL}/trainer/dashboard`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not retrieve dashboard.");
    }

    return data;
  },

  async getTeam(token) {
    const response = await fetch(`${API_BASE_URL}/team`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not retrieve team.");
    }

    return data;
  }

};