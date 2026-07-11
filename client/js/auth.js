// Authentication management helpers

const AUTH_TOKEN_KEY = 'admin_auth_token';
const API_BASE_URL = window.location.origin;

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function verifyToken() {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data.valid;
    } else {
      removeToken();
      return false;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

async function checkAuthAndRedirect() {
  const valid = await verifyToken();
  const currentPath = window.location.pathname;

  if (!valid) {
    if (!currentPath.includes('admin-login.html')) {
      window.location.href = '/admin-login.html';
    }
  } else {
    if (currentPath.includes('admin-login.html')) {
      window.location.href = '/admin-dashboard.html';
    }
  }
}

function logout() {
  removeToken();
  window.location.href = '/admin-login.html';
}
