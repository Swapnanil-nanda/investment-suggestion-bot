/* ============================================================
   AUTH.JS — Signup, Login, Session Management
   Uses IndexedDB (primary) + localStorage (fallback) for persistence
   SHA-256 password hashing via SubtleCrypto API
   ============================================================ */

const Auth = (() => {
    const DB_NAME = 'InvestmentSuggestionBot';
    const DB_VERSION = 1;
    const USERS_STORE = 'users';
    const PROFILES_STORE = 'profiles';
    const SESSION_KEY = 'isb_session';

    // Legacy keys for migration
    const LEGACY_USERS_KEY = 'isb_users';
    const LEGACY_PROFILE_KEY = 'isb_risk_profile';

    let db = null;

    // ---- IndexedDB Setup ----
    function openDB() {
        return new Promise((resolve, reject) => {
            if (db) { resolve(db); return; }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains(USERS_STORE)) {
                    database.createObjectStore(USERS_STORE, { keyPath: 'email' });
                }
                if (!database.objectStoreNames.contains(PROFILES_STORE)) {
                    database.createObjectStore(PROFILES_STORE, { keyPath: 'email' });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => {
                console.warn('IndexedDB not available, falling back to localStorage');
                reject(event.target.error);
            };
        });
    }

    // ---- DB Operations ----
    async function dbPut(storeName, data) {
        try {
            const database = await openDB();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.put(data);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch {
            // Fallback to localStorage
            const key = storeName === USERS_STORE ? LEGACY_USERS_KEY : LEGACY_PROFILE_KEY;
            const existing = JSON.parse(localStorage.getItem(key) || '{}');
            existing[data.email] = data;
            localStorage.setItem(key, JSON.stringify(existing));
        }
    }

    async function dbGet(storeName, key) {
        try {
            const database = await openDB();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch {
            // Fallback to localStorage
            const lsKey = storeName === USERS_STORE ? LEGACY_USERS_KEY : LEGACY_PROFILE_KEY;
            const data = JSON.parse(localStorage.getItem(lsKey) || '{}');
            return data[key] || null;
        }
    }

    async function dbDelete(storeName, key) {
        try {
            const database = await openDB();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch {
            const lsKey = storeName === USERS_STORE ? LEGACY_USERS_KEY : LEGACY_PROFILE_KEY;
            const data = JSON.parse(localStorage.getItem(lsKey) || '{}');
            delete data[key];
            localStorage.setItem(lsKey, JSON.stringify(data));
        }
    }

    // ---- Migrate legacy localStorage data to IndexedDB ----
    async function migrateLegacyData() {
        try {
            const legacyUsers = JSON.parse(localStorage.getItem(LEGACY_USERS_KEY) || '{}');
            const legacyProfiles = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || '{}');

            for (const [email, userData] of Object.entries(legacyUsers)) {
                const existing = await dbGet(USERS_STORE, email);
                if (!existing) {
                    await dbPut(USERS_STORE, { ...userData, email });
                }
            }

            for (const [email, profileData] of Object.entries(legacyProfiles)) {
                const existing = await dbGet(PROFILES_STORE, email);
                if (!existing) {
                    await dbPut(PROFILES_STORE, { ...profileData, email });
                }
            }
        } catch (e) {
            console.warn('Migration from localStorage failed (non-critical):', e);
        }
    }

    // SHA-256 hash (using SubtleCrypto API)
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function signup(name, email, password) {
        const emailKey = email.toLowerCase().trim();

        const existing = await dbGet(USERS_STORE, emailKey);
        if (existing) {
            return { success: false, error: 'An account with this email already exists.' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters long.' };
        }

        const hashedPw = await hashPassword(password);
        const user = {
            name: name.trim(),
            email: emailKey,
            password: hashedPw,
            createdAt: new Date().toISOString()
        };

        await dbPut(USERS_STORE, user);

        // Also save to localStorage as backup
        try {
            const lsUsers = JSON.parse(localStorage.getItem(LEGACY_USERS_KEY) || '{}');
            lsUsers[emailKey] = user;
            localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(lsUsers));
        } catch (e) { /* ignore */ }

        return { success: true };
    }

    async function login(email, password) {
        const emailKey = email.toLowerCase().trim();

        let user = await dbGet(USERS_STORE, emailKey);

        // If not found in IndexedDB, check localStorage
        if (!user) {
            try {
                const lsUsers = JSON.parse(localStorage.getItem(LEGACY_USERS_KEY) || '{}');
                user = lsUsers[emailKey] || null;
                // If found in localStorage, sync to IndexedDB
                if (user) {
                    await dbPut(USERS_STORE, { ...user, email: emailKey });
                }
            } catch (e) { /* ignore */ }
        }

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
        // Keep user data and risk profiles for re-login
        App.navigate('login');
    }

    async function getRiskProfile() {
        const session = getSession();
        if (!session) return null;

        let profile = await dbGet(PROFILES_STORE, session.email);

        // If not found in IndexedDB, check localStorage
        if (!profile) {
            try {
                const lsProfiles = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || '{}');
                profile = lsProfiles[session.email] || null;
                if (profile) {
                    await dbPut(PROFILES_STORE, { ...profile, email: session.email });
                }
            } catch (e) { /* ignore */ }
        }

        return profile;
    }

    async function saveRiskProfile(profile) {
        const session = getSession();
        if (!session) return;

        const data = {
            ...profile,
            email: session.email,
            updatedAt: new Date().toISOString()
        };

        await dbPut(PROFILES_STORE, data);

        // Also save to localStorage as backup
        try {
            const lsProfiles = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || '{}');
            lsProfiles[session.email] = data;
            localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(lsProfiles));
        } catch (e) { /* ignore */ }
    }

    async function changePassword(currentPassword, newPassword) {
        const session = getSession();
        if (!session) return { success: false, error: 'Not logged in.' };

        const user = await dbGet(USERS_STORE, session.email);
        if (!user) return { success: false, error: 'User not found.' };

        const currentHash = await hashPassword(currentPassword);
        if (currentHash !== user.password) {
            return { success: false, error: 'Current password is incorrect.' };
        }

        if (newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters.' };
        }

        user.password = await hashPassword(newPassword);
        await dbPut(USERS_STORE, user);

        // Update localStorage backup
        try {
            const lsUsers = JSON.parse(localStorage.getItem(LEGACY_USERS_KEY) || '{}');
            lsUsers[session.email] = user;
            localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(lsUsers));
        } catch (e) { /* ignore */ }

        return { success: true };
    }

    async function deleteAccount() {
        const session = getSession();
        if (!session) return;

        // Remove from IndexedDB
        await dbDelete(USERS_STORE, session.email);
        await dbDelete(PROFILES_STORE, session.email);

        // Remove from localStorage
        try {
            const lsUsers = JSON.parse(localStorage.getItem(LEGACY_USERS_KEY) || '{}');
            delete lsUsers[session.email];
            localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(lsUsers));
        } catch (e) { /* ignore */ }

        try {
            const lsProfiles = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || '{}');
            delete lsProfiles[session.email];
            localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(lsProfiles));
        } catch (e) { /* ignore */ }

        // Clear session
        localStorage.removeItem(SESSION_KEY);
        App.navigate('login');
    }

    async function getUserCreatedAt() {
        const session = getSession();
        if (!session) return null;
        const user = await dbGet(USERS_STORE, session.email);
        return user ? user.createdAt : null;
    }

    // Initialize DB and migrate legacy data
    async function initDB() {
        try {
            await openDB();
            await migrateLegacyData();
        } catch (e) {
            console.warn('DB init warning (localStorage fallback active):', e);
        }
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
                    const profile = await getRiskProfile();
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

    return { signup, login, getSession, logout, getRiskProfile, saveRiskProfile, hashPassword, changePassword, deleteAccount, getUserCreatedAt, initListeners, initDB };
})();
