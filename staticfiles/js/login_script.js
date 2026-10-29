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

// Removed mock localStorage redirect code

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
