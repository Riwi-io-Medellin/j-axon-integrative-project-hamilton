import { router } from '../router.js';
import { api } from '../services/api-client.js';
import { renderButton } from '../components/Button.js';

// Importamos los estilos específicos de la página.
// Vite se encargará de inyectarlos en el head.
import '../css/pages/login.css';

/**
 * Renderiza el HTML de la página de login.
 * @returns {string} El contenido HTML de la página.
 */
const render = () => {
    // Extraemos el contenido del body del antiguo login.html
    return `
        <div class="page-login">
            <div class="login-shell">
                <div class="login-card">
                    <div class="login-brand">
                        <img src="/logo_circular.png" alt="J-AXON" class="login-logo" />
                        <div class="login-brand-text">
                            <h1>Welcome to J-AXON</h1>
                            <p>Enter to manage your assets and services.</p>
                        </div>
                    </div>
                    <form id="loginForm" novalidate>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" placeholder="tu@empresa.com" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" placeholder="••••••••" required>
                        </div>
                        <div id="loginStatus" class="form-status" aria-live="polite"></div>
                        ${renderButton({
                            id: "loginBtn",
                            label: "Sign In",
                            type: "submit"
                        })}
                    </form>
                    <p class="login-footer">Don't have an account?
                    <a href="/register" id="navigateToRegister">Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    `;
};

/**
 * Inicializa los event listeners y la lógica de la página de login.
 */
const init = () => {
    const loginForm = document.getElementById('loginForm');
    const loginStatus = document.getElementById('loginStatus');
    const registerLink = document.getElementById('navigateToRegister');
    const submitBtn = document.getElementById('loginBtn');

    if (!loginForm || !loginStatus) {
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            loginStatus.textContent = 'Enter email and password.';
            return;
        }

        loginStatus.textContent = 'Processing...';
        if (submitBtn) {
            submitBtn.disabled = true;
        }

        try {
            const { user } = await api.auth.login(email, password);
            loginStatus.textContent = 'Login successful. Redirecting...';
            const target = router.getDefaultRoute(user);
            router.navigateTo(target || '/dashboard');
        } catch (error) {
            loginStatus.textContent = error.message || 'Invalid credentials. Please try again.';
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    });

    // Manejamos la navegación al registro a través del router
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigateTo(e.target.getAttribute('href'));
        });
    }
};

export const LoginPage = { render, init, meta: { bodyClass: 'page-login' } };
