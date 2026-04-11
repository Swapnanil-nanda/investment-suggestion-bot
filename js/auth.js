/* ============================================================
   AUTH.JS — Signup, Login, Session Management
   SHA-256 password hashing, localStorage-based
   ============================================================ */

const Auth = (() => {
    const USERS_KEY = 'isb_users';
    const SESSION_KEY = 'isb_session';
    const PROFILE_KEY = 'isb_risk_profile';

    // SHA-256 hash (using SubtleCrypto API)
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
        } catch {
            return {};
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    async function signup(name, email, password) {
        const users = getUsers();
        const emailKey = email.toLowerCase().trim();

        if (users[emailKey]) {
            return { success: false, error: 'An account with this email already exists.' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters long.' };
        }

        const hashedPw = await hashPassword(password);
        users[emailKey] = {
            name: name.trim(),
            email: emailKey,
            password: hashedPw,
            createdAt: new Date().toISOString()
        };
        saveUsers(users);

        return { success: true };
    }

    async function login(email, password) {
        const users = getUsers();
        const emailKey = email.toLowerCase().trim();
        const user = users[emailKey];

        if (!user) {
            return { success: false, error: 'No account found with this email. Please sign up first.' };
        }

        const hashedPw = await hashPassword(password);
        if (user.password !== hashedPw) {
            return { success: false, error: 'Incorrect password. Please try again.' };
        }

        // Create session
        const session = {
            email: user.email,
            name: user.name,
            loggedInAt: new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        return { success: true, user: session };
    }

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY));
        } catch {
            return null;
        }
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
        // Keep risk profile and users for re-login
        App.navigate('login');
    }

    function getRiskProfile() {
        const session = getSession();
        if (!session) return null;
        try {
            const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
            return profiles[session.email] || null;
        } catch {
            return null;
        }
    }

    function saveRiskProfile(profile) {
        const session = getSession();
        if (!session) return;
        try {
            const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
            profiles[session.email] = {
                ...profile,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
        } catch (e) {
            console.error('Error saving risk profile:', e);
        }
    }

    async function changePassword(currentPassword, newPassword) {
        const session = getSession();
        if (!session) return { success: false, error: 'Not logged in.' };

        const users = getUsers();
        const user = users[session.email];
        if (!user) return { success: false, error: 'User not found.' };

        const currentHash = await hashPassword(currentPassword);
        if (currentHash !== user.password) {
            return { success: false, error: 'Current password is incorrect.' };
        }

        if (newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters.' };
        }

        user.password = await hashPassword(newPassword);
        saveUsers(users);
        return { success: true };
    }

    function deleteAccount() {
        const session = getSession();
        if (!session) return;

        // Remove user from users list
        const users = getUsers();
        delete users[session.email];
        saveUsers(users);

        // Remove risk profile
        try {
            const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
            delete profiles[session.email];
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
        } catch (e) { /* ignore */ }

        // Clear session
        localStorage.removeItem(SESSION_KEY);

        App.navigate('login');
    }

    function getUserCreatedAt() {
        const session = getSession();
        if (!session) return null;
        const users = getUsers();
        const user = users[session.email];
        return user ? user.createdAt : null;
    }

    // Event Listeners
    function initListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const errorEl = document.getElementById('login-error');

                const result = await login(email, password);
                if (result.success) {
                    errorEl.style.display = 'none';
                    const profile = getRiskProfile();
                    if (profile) {
                        App.navigate('dashboard');
                    } else {
                        App.navigate('risk');
                    }
                } else {
                    errorEl.textContent = result.error;
                    errorEl.style.display = 'block';
                }
            });
        }

        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const confirm = document.getElementById('signup-confirm').value;
                const errorEl = document.getElementById('signup-error');

                if (password !== confirm) {
                    errorEl.textContent = 'Passwords do not match.';
                    errorEl.style.display = 'block';
                    return;
                }

                const result = await signup(name, email, password);
                if (result.success) {
                    errorEl.style.display = 'none';
                    // Auto-login after signup
                    await login(email, password);
                    App.navigate('risk');
                } else {
                    errorEl.textContent = result.error;
                    errorEl.style.display = 'block';
                }
            });
        }

        // Navigation links
        const gotoSignup = document.getElementById('goto-signup');
        if (gotoSignup) {
            gotoSignup.addEventListener('click', (e) => {
                e.preventDefault();
                App.navigate('signup');
            });
        }

        const gotoLogin = document.getElementById('goto-login');
        if (gotoLogin) {
            gotoLogin.addEventListener('click', (e) => {
                e.preventDefault();
                App.navigate('login');
            });
        }
    }

    return { signup, login, getSession, logout, getRiskProfile, saveRiskProfile, hashPassword, changePassword, deleteAccount, getUserCreatedAt, initListeners };
})();
