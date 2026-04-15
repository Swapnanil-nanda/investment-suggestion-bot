/* ============================================================
   PROFILE.JS — User Profile Management Page
   View profile, risk summary, change password, delete account
   ============================================================ */

const Profile = (() => {

    const goalLabels = {
        wealth: 'Wealth Building',
        retirement: 'Retirement Planning',
        income: 'Generate Income',
        preservation: 'Capital Preservation'
    };

    const toleranceLabels = {
        conservative: 'Conservative',
        balanced: 'Balanced',
        aggressive: 'Aggressive'
    };

    const horizonLabels = {
        short: 'Short-term (1-3 years)',
        medium: 'Medium-term (3-7 years)',
        long: 'Long-term (7+ years)'
    };

    const categoryLabels = {
        conservative: 'Conservative',
        balanced: 'Balanced',
        aggressive: 'Aggressive'
    };

    async function init() {
        const session = Auth.getSession();
        if (!session) {
            App.navigate('login');
            return;
        }

        await renderUserInfo(session);
        await renderRiskSummary();
    }

    async function renderUserInfo(session) {
        // Avatar initials
        const avatar = document.getElementById('profile-avatar');
        if (avatar && session.name) {
            const parts = session.name.trim().split(' ');
            const initials = parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : parts[0].substring(0, 2).toUpperCase();
            avatar.textContent = initials;
        }

        // Name & email
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        if (nameEl) nameEl.textContent = session.name || 'User';
        if (emailEl) emailEl.textContent = session.email || '';

        // Joined date
        const joinedEl = document.getElementById('profile-joined');
        const createdAt = await Auth.getUserCreatedAt();
        if (joinedEl && createdAt) {
            const date = new Date(createdAt);
            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            joinedEl.textContent = `Member since ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        }
    }

    async function renderRiskSummary() {
        const profile = await Auth.getRiskProfile();
        if (!profile) {
            const grid = document.getElementById('profile-risk-grid');
            if (grid) {
                grid.innerHTML = '<p class="card-subtitle" style="grid-column: 1/-1; text-align:center; padding: 20px;">No risk assessment completed yet. <a href="#" onclick="event.preventDefault(); App.navigate(\'risk\');" style="color: var(--accent-indigo); font-weight:600;">Take assessment →</a></p>';
            }
            return;
        }

        // Sentiment score
        const scoreEl = document.getElementById('profile-sentiment-score');
        if (scoreEl) scoreEl.textContent = profile.sentiment?.score ?? '—';

        // Risk category
        const categoryEl = document.getElementById('profile-risk-category');
        if (categoryEl) categoryEl.textContent = categoryLabels[profile.sentiment?.category] || 'Unknown';

        // Tolerance
        const toleranceEl = document.getElementById('profile-tolerance');
        if (toleranceEl) toleranceEl.textContent = toleranceLabels[profile.tolerance] || profile.tolerance;

        // Goal
        const goalEl = document.getElementById('profile-goal');
        if (goalEl) goalEl.textContent = goalLabels[profile.goal] || profile.goal;

        // Horizon
        const horizonEl = document.getElementById('profile-horizon');
        if (horizonEl) horizonEl.textContent = horizonLabels[profile.horizon] || profile.horizon;

        // Budget
        const budgetEl = document.getElementById('profile-budget');
        if (budgetEl) budgetEl.textContent = formatINR(profile.budget);
    }

    function initListeners() {
        // Back to dashboard
        const backBtn = document.getElementById('btn-profile-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => App.navigate('dashboard'));
        }

        // Retake risk assessment
        const retakeBtn = document.getElementById('btn-retake-risk');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => App.navigate('risk'));
        }

        // Change password form
        const pwForm = document.getElementById('change-password-form');
        if (pwForm) {
            pwForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const current = document.getElementById('current-password').value;
                const newPw = document.getElementById('new-password').value;
                const confirmPw = document.getElementById('confirm-new-password').value;
                const msgEl = document.getElementById('password-change-msg');

                if (newPw !== confirmPw) {
                    showMessage(msgEl, 'New passwords do not match.', 'error');
                    return;
                }

                const result = await Auth.changePassword(current, newPw);
                if (result.success) {
                    showMessage(msgEl, 'Password updated successfully!', 'success');
                    pwForm.reset();
                } else {
                    showMessage(msgEl, result.error, 'error');
                }
            });
        }

        // Delete account button (open modal)
        const deleteBtn = document.getElementById('btn-delete-account');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const modal = document.getElementById('delete-modal');
                if (modal) modal.style.display = 'flex';
            });
        }

        // Cancel delete
        const cancelBtn = document.getElementById('btn-cancel-delete');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('delete-modal');
                if (modal) modal.style.display = 'none';
            });
        }

        // Confirm delete
        const confirmBtn = document.getElementById('btn-confirm-delete');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const modal = document.getElementById('delete-modal');
                if (modal) modal.style.display = 'none';
                await Auth.deleteAccount();
            });
        }
    }

    function showMessage(el, message, type) {
        if (!el) return;
        el.textContent = message;
        el.className = 'form-message form-message--' + type;
        el.style.display = 'block';

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }

    return { init, initListeners };
})();
