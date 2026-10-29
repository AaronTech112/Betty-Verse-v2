const loginPassword = document.getElementById('loginPassword');
const registerPassword = document.getElementById('registerPassword');
const loginToggle = document.getElementById('loginToggle');
const registerToggle = document.getElementById('registerToggle');

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
