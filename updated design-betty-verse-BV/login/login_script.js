const loginPassword = document.getElementById('loginPassword');
const registerPassword = document.getElementById('registerPassword');
const loginToggle = document.getElementById('loginToggle');
const registerToggle = document.getElementById('registerToggle');
const authForm = document.querySelector('.auth-form');
const AUTH_STORAGE_KEY = 'bettyverse-auth-session';
const ACCOUNT_MOCK_STORAGE_KEY = 'bettyverse-account-mock';

function togglePassword(input, toggleBtn) {
    if (!input || !toggleBtn) {
        return;
    }

    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;

    const icon = toggleBtn.querySelector('i');
    if (!icon) {
        return;
    }

    icon.className = type === 'password' ? 'bx bx-hide' : 'bx bx-show';
}

if (loginToggle && loginPassword) {
    loginToggle.addEventListener('click', () => {
        togglePassword(loginPassword, loginToggle);
    });
}

if (registerToggle && registerPassword) {
    registerToggle.addEventListener('click', () => {
        togglePassword(registerPassword, registerToggle);
    });
}

function buildNameFromEmail(email) {
    if (!email || email.indexOf('@') === -1) {
        return 'BettyVerse Client';
    }

    const localPart = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    if (!localPart) {
        return 'BettyVerse Client';
    }

    return localPart
        .split(' ')
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ');
}

function saveSession(payload) {
    const nextSession = {
        token: 'frontend-demo-token',
        refreshToken: 'frontend-demo-refresh-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        user: {
            id: 'client-local',
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            avatar: payload.avatar || '../images/logo.png'
        }
    };

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    window.localStorage.removeItem(ACCOUNT_MOCK_STORAGE_KEY);
}

function redirectToDashboard() {
    window.location.href = '../user-dashboard.html';
}

if (loginPassword && window.localStorage.getItem(AUTH_STORAGE_KEY)) {
    redirectToDashboard();
}

function handleLoginSubmit(event) {
    event.preventDefault();

    const emailField = authForm.querySelector('input[type="email"]');
    const passwordField = authForm.querySelector('input[type="password"]');
    const email = emailField ? emailField.value.trim() : '';
    const password = passwordField ? passwordField.value : '';

    if (!email || !password) {
        return;
    }

    saveSession({
        name: buildNameFromEmail(email),
        email: email,
        phone: '+234 800 000 0000'
    });
    redirectToDashboard();
}

function handleSignupSubmit(event) {
    event.preventDefault();

    const emailField = authForm.querySelector('input[type="email"]');
    const textFields = authForm.querySelectorAll('input[type="text"]');
    const passwordField = authForm.querySelector('input[type="password"]');
    const name = textFields[0] ? textFields[0].value.trim() : '';
    const phone = textFields[1] ? textFields[1].value.trim() : '';
    const email = emailField ? emailField.value.trim() : '';
    const password = passwordField ? passwordField.value : '';

    if (!name || !email || !phone || !password || password.length < 8) {
        return;
    }

    saveSession({
        name: name,
        email: email,
        phone: phone
    });
    redirectToDashboard();
}

if (authForm) {
    if (loginPassword) {
        authForm.addEventListener('submit', handleLoginSubmit);
    } else if (registerPassword) {
        authForm.addEventListener('submit', handleSignupSubmit);
    }
}

function initAuthBackToTop() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'auth-back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.setAttribute('title', 'Back to top');
    button.innerHTML = "<i class='bx bx-up-arrow-alt' aria-hidden='true'></i>";
    document.body.appendChild(button);

    function syncVisibility() {
        const scrollTop = window.scrollY || window.pageYOffset || 0;
        button.classList.toggle('is-visible', scrollTop > 240);
    }

    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    window.addEventListener('scroll', syncVisibility, { passive: true });
    syncVisibility();
}

initAuthBackToTop();
