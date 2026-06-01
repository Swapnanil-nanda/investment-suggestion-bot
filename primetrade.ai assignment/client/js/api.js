const API_BASE_URL = '/api/v1';

/**
 * Base fetch API wrapper supporting automatic authorization token insertion
 * and unified success/error parsing.
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, clear credentials and redirect to login
      if (response.status === 401) {
        console.warn('🔒 Session expired. Redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Prevent redirect loops if already on login/register pages
        if (!window.location.pathname.endsWith('index.html') && 
            !window.location.pathname.endsWith('register.html') &&
            window.location.pathname !== '/') {
          window.location.href = '/index.html?expired=true';
        }
      }
      
      const errorMsg = data.message || `API Error: ${response.statusText}`;
      const errors = data.errors || [];
      return { success: false, status: response.status, message: errorMsg, errors };
    }

    return { success: true, status: response.status, ...data };
  } catch (error) {
    console.error('🌐 Network error calling API:', error);
    return {
      success: false,
      message: 'Unable to connect to the server. Please check if the backend is running.',
      errors: []
    };
  }
}

// Toast notification trigger utility
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : '❌';
  
  toast.innerHTML = `
    <span>${icon}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  // Auto-remove toast after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s forwards reverse cubic-bezier(0.175, 0.885, 0.32, 1)';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}
