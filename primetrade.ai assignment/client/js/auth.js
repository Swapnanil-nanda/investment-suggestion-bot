document.addEventListener('DOMContentLoaded', () => {
  // Check if session has expired from query string
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired') === 'true') {
    showToast('Your session has expired. Please log in again.', 'error');
  }

  // Redirect to dashboard if already logged in
  const token = localStorage.getItem('token');
  if (token) {
    // Basic verify that we're on index or register
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('register.html') || window.location.pathname === '/') {
      window.location.href = '/dashboard.html';
      return;
    }
  }

  // Handle Login Form Submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showToast('Please fill in all credentials.', 'error');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Signing In... ⏳';

      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      if (response.success) {
        // Store session token and user details
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        showToast('Welcome back! Login successful.', 'success');
        
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1000);
      } else {
        showToast(response.message, 'error');
      }
    });
  }

  // Handle Registration Form Submission
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const role = document.getElementById('role').value;

      // Front-end validations
      if (!name || !email || !password || !confirmPassword) {
        showToast('Please complete all form fields.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating Account... ⏳';

      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      if (response.success) {
        showToast('Registration successful! Logging in...', 'success');
        
        // Auto-save the registered session token
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1200);
      } else {
        // Handle validation errors if list is returned
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach(err => showToast(`${err.field}: ${err.message}`, 'error'));
        } else {
          showToast(response.message, 'error');
        }
      }
    });
  }
});
