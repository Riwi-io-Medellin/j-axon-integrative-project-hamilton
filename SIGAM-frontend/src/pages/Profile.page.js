import { Navbar } from "../components/Navbar.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { getUser, clearStorage } from "../state/storage.js";
import { router } from "../router.js";
import { renderButton } from "../components/Button.js";
import "../css/pages/profile.css";

const ROLE_ALLOWLIST = ["Gerente", "Analista", "Tecnico", "Usuario", "Auditor"];

const render = async () => {
  const navbarHTML = Navbar.render();

  return `
    ${navbarHTML}
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Profile</h2>
          <p class="text-muted mb-0">Your account details and security settings</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card shadow-sm border-0 profile-card">
            <div class="card-body">
              <h5 class="fw-semibold mb-3">Account Details</h5>
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input id="profileName" class="form-control" type="text" readonly>
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input id="profileEmail" class="form-control" type="email" readonly>
              </div>
              <div class="mb-3">
                <label class="form-label">Role</label>
                <input id="profileRole" class="form-control" type="text" readonly>
              </div>
              <div class="mb-0">
                <label class="form-label">Last Access</label>
                <input id="profileLastAccess" class="form-control" type="text" readonly>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card shadow-sm border-0 profile-card">
            <div class="card-body">
              <h5 class="fw-semibold mb-3">Change Password</h5>
              <form id="passwordForm" novalidate>
                <div class="mb-3">
                  <label class="form-label">Current Password</label>
                  <input id="currentPassword" class="form-control" type="password" required>
                  <div class="invalid-feedback">Current password is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">New Password</label>
                  <input id="newPassword" class="form-control" type="password" required minlength="8">
                  <div class="invalid-feedback">Password must be at least 8 characters long.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Confirm New Password</label>
                  <input id="confirmPassword" class="form-control" type="password" required>
                  <div class="invalid-feedback">Please confirm the new password.</div>
                </div>
                <div class="d-flex align-items-center gap-3">
                  ${renderButton({
                    id: "passwordSubmit",
                    label: "Update Password",
                    type: "submit",
                    variant: "dark"
                  })}
                  <span id="passwordStatus" class="small text-muted"></span>
                </div>
              </form>
            </div>
          </div>

          <div class="card shadow-sm border-0 profile-card mt-4">
            <div class="card-body">
              <h5 class="fw-semibold mb-3">Session</h5>
              <p class="text-muted">If you suspect any unusual activity, sign out and log in again.</p>
              ${renderButton({
                id: "logoutBtn",
                label: "Sign out",
                variant: "outlineSecondary"
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const init = async () => {
  Navbar.init();
  loadProfile();
  bindEvents();
};

const loadProfile = () => {
  const user = getUser();
  const passwordStatus = document.querySelector("#passwordStatus");

  if (!user) {
    if (passwordStatus) {
      passwordStatus.textContent = "No user session found.";
      passwordStatus.classList.add("text-danger");
    }
    return;
  }

  const name = user.nombre || user.name || user.fullName || user.full_name || "User";
  const email = user.email || user.correo || "";
  const role = user.rol || user.role || user.Rol || user.ROLE || "";
  const lastAccess = user.ultimo_acceso || user.lastAccess || user.fecha_creacion || "";

  const nameInput = document.querySelector("#profileName");
  const emailInput = document.querySelector("#profileEmail");
  const roleInput = document.querySelector("#profileRole");
  const lastAccessInput = document.querySelector("#profileLastAccess");

  if (nameInput) nameInput.value = name;
  if (emailInput) emailInput.value = email;
  if (roleInput) roleInput.value = role || "Usuario";
  if (lastAccessInput) lastAccessInput.value = lastAccess || "-";
};

const setPasswordStatus = (message, type) => {
  const statusEl = document.querySelector("#passwordStatus");
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.classList.remove("text-success", "text-danger", "text-muted");
  if (type === "success") {
    statusEl.classList.add("text-success");
  } else if (type === "error") {
    statusEl.classList.add("text-danger");
  } else {
    statusEl.classList.add("text-muted");
  }
};

const setSubmitting = (isSubmitting) => {
  const submitBtn = document.querySelector("#passwordSubmit");
  if (!submitBtn) return;

  submitBtn.disabled = isSubmitting;
  if (isSubmitting) {
    submitBtn.textContent = "Updating...";
    submitBtn.innerHTML = "Updating...";
  } else {
    submitBtn.textContent = "Update Password";
    submitBtn.innerHTML = "Update Password";
  }
};

const buildPasswordPayload = (currentPassword, newPassword, confirmPassword) => ({
  currentPassword: currentPassword,
  newPassword: newPassword,
  password: newPassword,
  oldPassword: currentPassword,
  old_password: currentPassword,
  new_password: newPassword,
  confirmPassword: confirmPassword,
  confirm_password: confirmPassword
});
const handlePassword = async (event) => {
  event.preventDefault();
  setPasswordStatus("");

  const currentPassword = document.querySelector("#currentPassword")?.value.trim() || "";
  const newPassword = document.querySelector("#newPassword")?.value.trim() || "";
  const confirmPassword = document.querySelector("#confirmPassword")?.value.trim() || "";

  // Validaciones básicas
  if (!currentPassword) {
    setPasswordStatus("Current password is required.", "error");
    return;
  }

  if (!newPassword) {
    setPasswordStatus("New password is required.", "error");
    return;
  }

  if (newPassword.length < 8) {
    setPasswordStatus("New password must be at least 8 characters long.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordStatus("New passwords do not match.", "error");
    return;
  }

  if (currentPassword === newPassword) {
    setPasswordStatus("New password must be different from current password.", "error");
    return;
  }

  const user = getUser();
  const userId = user && (user.id || user.id_usuario || user.userId);
  if (!userId) {
    setPasswordStatus("User ID not found in session.", "error");
    return;
  }

  if (!SIGAM_CONFIG.API_BASE_URL) {
    setPasswordStatus("API not available. Please check configuration.", "error");
    return;
  }

  try {
    setSubmitting(true);
    setPasswordStatus("Updating password...", "");

    const safeUserId = encodeURIComponent(userId);
    const specificEndpoint = `${SIGAM_CONFIG.USUARIOS_ENDPOINT}/${safeUserId}/password`;
    const userEndpoint = `${SIGAM_CONFIG.USUARIOS_ENDPOINT}/${safeUserId}`;
    const shouldFallback = (error) => [404, 405, 501].includes(error?.status);

    // Intentar con el endpoint específico primero
    try {
      await api.apiRequest(specificEndpoint, {
        method: "PUT",
        body: buildPasswordPayload(currentPassword, newPassword, confirmPassword)
      });
    } catch (specificError) {
      if (shouldFallback(specificError)) {
        console.warn("Specific password endpoint failed, trying PATCH:", specificError.message);
        try {
          await api.apiRequest(specificEndpoint, {
            method: "PATCH",
            body: buildPasswordPayload(currentPassword, newPassword, confirmPassword)
          });
        } catch (patchError) {
          if (shouldFallback(patchError)) {
            console.warn("Specific PATCH failed, trying user update:", patchError.message);
            try {
              await api.apiRequest(userEndpoint, {
                method: "PATCH",
                body: buildPasswordPayload(currentPassword, newPassword, confirmPassword)
              });
            } catch (userPatchError) {
              if (shouldFallback(userPatchError)) {
                await api.apiRequest(userEndpoint, {
                  method: "PUT",
                  body: buildPasswordPayload(currentPassword, newPassword, confirmPassword)
                });
              } else {
                throw userPatchError;
              }
            }
          } else {
            throw patchError;
          }
        }
      } else {
        throw specificError;
      }
    }
    setPasswordStatus("Password updated successfully!", "success");
    const form = document.querySelector("#passwordForm");
    if (form) form.reset();

    // Opcional: mostrar un mensaje de éxito temporal y luego limpiar
    setTimeout(() => {
      setPasswordStatus("", "");
    }, 3000);

  } catch (error) {
    console.error("Password update error:", error);
    const errorMessage = error.message || "Could not update password. Please try again.";
    setPasswordStatus(errorMessage, "error");
  } finally {
    setSubmitting(false);
  }
};

const handleLogout = () => {
  clearStorage();
  router.navigateTo("/login", { replace: true });
};

const bindEvents = () => {
  const form = document.querySelector("#passwordForm");
  const logoutBtn = document.querySelector("#logoutBtn");

  if (form) {
    form.addEventListener("submit", handlePassword);

    // Validación en tiempo real para mejor UX
    const inputs = form.querySelectorAll("input");
    inputs.forEach(input => {
      input.addEventListener("blur", () => {
        if (input.checkValidity()) {
          input.classList.remove("is-invalid");
        } else {
          input.classList.add("is-invalid");
        }
      });

      input.addEventListener("input", () => {
        if (input.classList.contains("is-invalid") && input.checkValidity()) {
          input.classList.remove("is-invalid");
        }
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
};

export const ProfilePage = {
  render,
  init,
  meta: {
    bodyClass: "page-profile",
    roles: ROLE_ALLOWLIST
  }
};

