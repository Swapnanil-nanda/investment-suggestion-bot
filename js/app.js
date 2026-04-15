/* ============================================================
   APP.JS — Router & Page Manager
   ============================================================ */

const App = (() => {
    const pages = ['login', 'signup', 'risk', 'dashboard', 'portfolio', 'profile'];
    let currentPage = 'login';

    async function init() {
        // Initialize IndexedDB and migrate legacy data
        await Auth.initDB();

        // Check session and route
        const session = Auth.getSession();
        if (session) {
            const profile = await Auth.getRiskProfile();
            if (profile) {
                navigate('dashboard');
            } else {
                navigate('risk');
            }
        } else {
            navigate('login');
        }
    }

    function navigate(page) {
        // Hide all pages
        pages.forEach(p => {
            const el = document.getElementById(`page-${p}`);
            if (el) el.classList.remove('active');
        });

        // Show target page
        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.classList.add('active');
            currentPage = page;
        }

        // Initialize page-specific logic
        switch(page) {
            case 'login':
                // Reset form
                const lf = document.getElementById('login-form');
                if (lf) lf.reset();
                break;
            case 'signup':
                const sf = document.getElementById('signup-form');
                if (sf) sf.reset();
                break;
            case 'risk':
                Risk.init();
                break;
            case 'dashboard':
                Dashboard.init();
                break;
            case 'portfolio':
                Dashboard.initPortfolio();
                break;
            case 'profile':
                Profile.init();
                break;
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    function getCurrentPage() {
        return currentPage;
    }

    return { init, navigate, getCurrentPage };
})();

// Format number to Indian number system with rupee symbol
function formatINR(num) {
    if (num === undefined || num === null) return '₹0';
    num = Math.round(num);
    const isNeg = num < 0;
    num = Math.abs(num);
    let str = num.toString();
    let last3 = str.substring(str.length - 3);
    let rest = str.substring(0, str.length - 3);
    if (rest !== '') {
        last3 = ',' + last3;
    }
    let result = '';
    while (rest.length > 2) {
        result = ',' + rest.substring(rest.length - 2) + result;
        rest = rest.substring(0, rest.length - 2);
    }
    result = rest + result + last3;
    return (isNeg ? '-' : '') + '₹' + result;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.initListeners();
    Risk.initListeners();
    Dashboard.initListeners();
    Profile.initListeners();
    App.init();
});
