import { router } from "../router.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { renderButton } from "../components/Button.js";
import "../css/pages/register.css";

/**
 * Renderiza el HTML de la página de registro.
 */
const render = () => {
  return `
    <div class="page-register">
      <div class="register-shell">
        <div class="register-card">
          <div class="register-brand">
            <img src="/logo_circular.png" alt="J-AXON" class="register-logo" />
            <div class="register-brand-text">
              <h1>Create a J-AXON Account</h1>
              <p>Start managing users and services.</p>
            </div>
          </div>

          <form id="registerForm" novalidate>
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" placeholder="Name" required>
            </div>
            <div class="form-group">
              <label for="surname">Last Name</label>
              <input type="text" id="surname" placeholder="Last Name" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" placeholder="tu@empresa.com" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" placeholder="••••••••" required>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" placeholder="••••••••" required>
            </div>
  \
            <div id="registerStatus" class="form-status" aria-live="polite"></div>
            ${renderButton({
              id: "registerBtn",
              label: "Create Account",
              type: "submit"
            })}
          </form>

          <p class="register-footer">Already have an account?
          <a href="/login" id="navigateToLogin"> Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Lógica e inicialización de eventos.
 */
const init = () => {
  const form = document.getElementById("registerForm");
  const statusDiv = document.getElementById("registerStatus");
  const loginLink = document.getElementById("navigateToLogin");
  const submitBtn = document.getElementById("registerBtn");

  if (!form || !statusDiv) {
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const surname = document.getElementById("surname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = "Usuario";

    if (!name || !surname || !email || !password) {
      statusDiv.textContent = "Please complete all required fields.";
      statusDiv.classList.add("text-danger");
      return;
    }

    if (password !== confirmPassword) {
      statusDiv.textContent = "Passwords do not match.";
      statusDiv.classList.add("text-danger");
      return;
    }

    if (!SIGAM_CONFIG.API_BASE_URL) {
      statusDiv.textContent = "API config not loaded.";
      statusDiv.classList.add("text-danger");
      return;
    }

    statusDiv.textContent = "Creating account...";
    statusDiv.classList.remove("text-danger");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating...";
    }

    try {
      await api.apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          nombre: `${name} ${surname}`.trim(),
          email,
          password,
          rol: role
        }
      });
      statusDiv.textContent = "Registration successful. Redirecting...";
      statusDiv.classList.remove("text-danger");
      router.navigateTo("/login");
    } catch (error) {
      statusDiv.textContent = error.message || "Registration error.";
      statusDiv.classList.add("text-danger");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    }
  });

  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      router.navigateTo("/login");
    });
  }
};

export const RegisterPage = { render, init, meta: { bodyClass: "page-register" } };
