import { Navbar } from "../components/Navbar.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { renderButton } from "../components/Button.js";
import "../css/pages/admin.css";

const ROLE_ALLOWLIST = ["Gerente", "Auditor", "Admin", "Administrador"];

const render = async () => {
  const navbarHTML = await Navbar.render();

  return `
      ${navbarHTML}
      <div class="p-4 bg-light min-vh-100 admin-container">

        <!-- Encabezado de la página -->
        <div class="mb-4">
          <h4 class="fw-bold mb-1">Administration Panel</h4>
          <small class="text-muted">System management</small>
        </div>

        <!-- Tarjetas de Estadísticas -->
        <div class="admin-stats mb-4">
          <!-- Total de usuarios -->
          <div class="card border-0 shadow-sm p-4 rounded-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-muted">Total Users</small>
                <h4 id="statUsers" class="fw-bold mt-2">0</h4>
              </div>
              <i class="bi bi-people text-primary fs-4"></i>
            </div>
          </div>

          <!-- Activos gestionados -->
          <div class="card border-0 shadow-sm p-4 rounded-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-muted">Managed Assets</small>
                <h4 id="statAssets" class="fw-bold mt-2">0</h4>
              </div>
              <i class="bi bi-hdd-stack text-primary fs-4"></i>
            </div>
          </div>

          <!-- Tickets pendientes -->
          <div class="card border-0 shadow-sm p-4 rounded-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-muted">Pending Tickets</small>
                <h4 id="statTickets" class="fw-bold mt-2">0</h4>
              </div>
              <i class="bi bi-ticket text-primary fs-4"></i>
            </div>
          </div>

          <!-- Estado del sistema -->
          <div class="card border-0 shadow-sm p-4 rounded-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-muted">System Status</small>
                <h5 class="fw-bold text-success mt-2">Optimal</h5>
                <small class="text-muted">99.8% uptime</small>
              </div>
              <i class="bi bi-bar-chart text-primary fs-4"></i>
            </div>
          </div>
        </div>

        <!-- Menú de Configuración -->
        <ul class="nav nav-pills mb-4" id="admin-tabs">
          <li class="nav-item">
            ${renderButton({
              label: "Users",
              variant: "nav",
              className: "active",
              attrs: { "data-section": "users" }
            })}
          </li>
          <li class="nav-item">
            ${renderButton({
              label: "Configuration",
              variant: "nav",
              attrs: { "data-section": "configuration" }
            })}
          </li>
          <li class="nav-item">
            ${renderButton({
              label: "Security",
              variant: "nav",
              attrs: { "data-section": "security" }
            })}
          </li>
          <li class="nav-item">
            ${renderButton({
              label: "Backup",
              variant: "nav",
              attrs: { "data-section": "backup" }
            })}
          </li>
        </ul>

        <!-- Sección Gestión de Usuarios -->
        <div id="section-users" class="card border-0 shadow-sm rounded-4 p-4 admin-section">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-semibold mb-0">User Management</h6>
            ${renderButton({
              label: "+ New User",
              variant: "primaryPill",
              attrs: { "data-bs-toggle": "modal", "data-bs-target": "#userModal" }
            })}
          </div>

          <!-- Filtros -->
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input id="searchInput" type="text" class="form-control" placeholder="Search users...">
              </div>
            </div>
            <div class="col-md-3">
              <select id="roleFilter" class="form-select">
                <option value="">All Roles</option>
                <option value="Gerente">Manager</option>
                <option value="Analista">Analyst</option>
                <option value="Tecnico">Technician</option>
                <option value="Auditor">Auditor</option>
                <option value="Usuario">User</option>
              </select>
            </div>
          </div>

          <!-- Tabla -->
          <div class="table-responsive">
            <div id="adminStatus" class="small text-muted mb-2" aria-live="polite"></div>
            <table class="table align-middle">
              <thead class="text-muted">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="userTable"></tbody>
            </table>
          </div>
        </div>

        <div id="section-configuration" class="card border-0 shadow-sm rounded-4 p-4 admin-section d-none">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-semibold mb-0">System Configuration</h6>
          </div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Company Name</label>
              <input id="configCompany" class="form-control" placeholder="J-AXON">
            </div>
            <div class="col-md-6">
              <label class="form-label">Default Role</label>
              <select id="configDefaultRole" class="form-select">
                <option value="Usuario">User</option>
                <option value="Analista">Analyst</option>
                <option value="Tecnico">Technician</option>
                <option value="Gerente">Manager</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Session Timeout (minutes)</label>
              <input id="configTimeout" type="number" class="form-control" value="60">
            </div>
            <div class="col-md-6">
              <label class="form-label">Notifications</label>
              <select id="configNotifications" class="form-select">
                <option>Enabled</option>
                <option>Disabled</option>
              </select>
            </div>
          </div>
          <div class="mt-4">
            ${renderButton({
              id: "configSave",
              label: "Save Configuration",
              variant: "dark"
            })}
            <span id="configStatus" class="ms-2 small text-muted"></span>
          </div>
        </div>
        <div id="section-security" class="card border-0 shadow-sm rounded-4 p-4 admin-section d-none">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-semibold mb-0">Security Settings</h6>
          </div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Minimum Password Length</label>
              <input id="securityMinLength" type="number" class="form-control" value="8">
            </div>
            <div class="col-md-6">
              <label class="form-label">Require Special Characters</label>
              <select id="securitySpecial" class="form-select">
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Require 2FA</label>
              <select id="security2fa" class="form-select">
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Account Lockout (attempts)</label>
              <input id="securityLockout" type="number" class="form-control" value="5">
            </div>
          </div>
          <div class="mt-4">
            ${renderButton({
              id: "securitySave",
              label: "Save Security",
              variant: "dark"
            })}
            <span id="securityStatus" class="ms-2 small text-muted"></span>
          </div>
        </div>
        <div id="section-backup" class="card border-0 shadow-sm rounded-4 p-4 admin-section d-none">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-semibold mb-0">Backup Management</h6>
          </div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Backup Frequency</label>
              <select id="backupFrequency" class="form-select">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Retention (days)</label>
              <input id="backupRetention" type="number" class="form-control" value="30">
            </div>
          </div>
          <div class="mt-4 d-flex flex-wrap gap-2">
            ${renderButton({
              id: "backupRun",
              label: "Run Backup",
              variant: "dark"
            })}
            ${renderButton({
              id: "backupRestore",
              label: "Restore Last Backup",
              variant: "outlineSecondary"
            })}
            <span id="backupStatus" class="ms-2 small text-muted"></span>
          </div>
        </div>

      </div>

      <!-- Modal Usuarios -->
      <div class="modal fade" id="userModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">User</h5>
            </div>
            <div class="modal-body">
              <input id="name" class="form-control mb-2" placeholder="Name">
              <input id="email" class="form-control mb-2" placeholder="Email">
              <select id="role" class="form-select">
                <option value="Usuario">User</option>
                <option value="Analista">Analyst</option>
                <option value="Tecnico">Technician</option>
                <option value="Gerente">Manager</option>
                <option value="Auditor">Auditor</option>
              </select>
              <input id="password" type="password" class="form-control mt-2" placeholder="Password">
              <input type="hidden" id="editIndex">
            </div>
            <div class="modal-footer">
              ${renderButton({
                label: "Cancel",
                variant: "secondary",
                attrs: { "data-bs-dismiss": "modal" }
              })}
      ${renderButton({
        id: "saveUserBtn",
        label: "Save",
        variant: "dark"
      })}
            </div>
          </div>
        </div>
      </div>
    `;
};

const init = async () => {
  Navbar.init();
  await ensureBootstrapJs();

  const state = {
    users: [],
    usingApi: false,
    refreshTimer: null
  };

  const statusEl = document.querySelector("#adminStatus");
  const searchInput = document.querySelector("#searchInput");
  const roleFilter = document.querySelector("#roleFilter");
  const userTable = document.querySelector("#userTable");

  const tabs = document.querySelector("#admin-tabs");
  const sections = {
    users: document.querySelector("#section-users"),
    configuration: document.querySelector("#section-configuration"),
    security: document.querySelector("#section-security"),
    backup: document.querySelector("#section-backup")
  };

  const configSave = document.querySelector("#configSave");
  const configStatus = document.querySelector("#configStatus");
  const securitySave = document.querySelector("#securitySave");
  const securityStatus = document.querySelector("#securityStatus");
  const backupRun = document.querySelector("#backupRun");
  const backupRestore = document.querySelector("#backupRestore");
  const backupStatus = document.querySelector("#backupStatus");

  const setStatus = (message, type) => {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.className = "small";
    if (type === "error") {
      statusEl.classList.add("text-danger");
    } else if (type === "success") {
      statusEl.classList.add("text-success");
    } else {
      statusEl.classList.add("text-muted");
    }
  };

  const normalizeUser = (raw) => {
    return {
      id: raw.id_usuario || raw.id || raw.userId || "",
      name: raw.nombre || raw.name || "",
      email: raw.email || "",
      role: raw.rol || raw.role || "Usuario",
      status: raw.estado || raw.status || "Active",
      lastAccess: raw.ultimo_acceso || raw.lastAccess || raw.fecha_creacion || ""
    };
  };

  const loadUsers = async () => {
    if (SIGAM_CONFIG.API_BASE_URL) {
      try {
        const payload = await api.apiRequest(`${SIGAM_CONFIG.USUARIOS_ENDPOINT}?limit=50&offset=0`);
        const list = Array.isArray(payload) ? payload : payload?.data || payload?.users || [];
        state.users = (list || []).map((user) => normalizeUser(user));
        state.usingApi = true;
        setStatus("Users loaded from the API.", "success");
        renderUsers();
        return;
      } catch (error) {
        setStatus("Could not load users from the API. Using local cache.", "error");
      }
    }

    state.usingApi = false;
    state.users = JSON.parse(localStorage.getItem("users") || "[]");
    renderUsers();
  };

  const badgeStatus = (status) => {
    if (status === "Active") {
      return '<span class="badge bg-success-subtle text-success rounded-pill">Active</span>';
    }
    if (status === "Blocked") {
      return '<span class="badge bg-danger-subtle text-danger rounded-pill">Blocked</span>';
    }
    return '<span class="badge bg-secondary-subtle text-secondary rounded-pill">Inactive</span>';
  };

  const badgeRole = (role) => {
    if (role === "Gerente") {
      return '<span class="badge bg-primary">Manager</span>';
    }
    if (role === "Tecnico") {
      return '<span class="badge bg-info text-dark">Technician</span>';
    }
    if (role === "Analista") {
      return '<span class="badge bg-secondary">Analyst</span>';
    }
    if (role === "Auditor") {
      return '<span class="badge bg-dark">Auditor</span>';
    }
    return '<span class="badge bg-secondary">User</span>';
  };

  const timeAgo = (date) => {
    if (!date) return "-";

    const now = new Date();
    const past = new Date(date);

    const seconds = Math.floor((now - past) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;

    return `${days} days ago`;
  };

  const updateStats = () => {
    const usersCount = state.users.length;
    const assets = JSON.parse(localStorage.getItem("assets") || "[]");
    const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

    const usersCard = document.querySelector("#statUsers");
    const assetsCard = document.querySelector("#statAssets");
    const ticketsCard = document.querySelector("#statTickets");

    if (usersCard) usersCard.innerText = usersCount;
    if (assetsCard) assetsCard.innerText = assets.length;
    if (ticketsCard) ticketsCard.innerText = tickets.length;
  };

  const renderUsers = () => {
    if (!userTable) return;
    userTable.innerHTML = "";

    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const roleValue = roleFilter ? roleFilter.value.trim().toLowerCase() : "";

    const filtered = state.users.filter((user) => {
      const roleMatch = !roleValue
        ? true
        : String(user.role || "").toLowerCase() === roleValue;
      if (!roleMatch) return false;
      if (!query) return true;
      const haystack = `${user.name || ""} ${user.email || ""} ${user.role || ""}`.toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      userTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            No users found. Add a new user to populate the table.
          </td>
        </tr>
      `;
    } else {
      filtered.forEach((user, index) => {
        userTable.innerHTML += `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${badgeRole(user.role)}</td>
            <td>${badgeStatus(user.status)}</td>
            <td>${timeAgo(user.lastAccess)}</td>
            <td>
              ${renderButton({
                content: '<i class="bi bi-pencil"></i>',
                variant: "light",
                className: "btn-sm",
                attrs: { "data-admin-action": "edit", "data-index": index }
              })}
              ${renderButton({
                content: '<i class="bi bi-trash"></i>',
                variant: "light",
                className: "btn-sm text-danger",
                attrs: { "data-admin-action": "delete", "data-index": index }
              })}
            </td>
          </tr>
        `;
      });
    }

    updateStats();
  };

  const showSection = (key) => {
    Object.keys(sections).forEach((name) => {
      const section = sections[name];
      if (!section) return;
      if (name === key) {
        section.classList.remove("d-none");
      } else {
        section.classList.add("d-none");
      }
    });
  };

  const handleConfigSave = () => {
    const payload = {
      company: document.querySelector("#configCompany")?.value.trim(),
      defaultRole: document.querySelector("#configDefaultRole")?.value,
      timeout: document.querySelector("#configTimeout")?.value,
      notifications: document.querySelector("#configNotifications")?.value
    };
    localStorage.setItem("admin_config", JSON.stringify(payload));
    if (configStatus) configStatus.textContent = "Configuration saved.";
  };

  const handleSecuritySave = () => {
    const payload = {
      minLength: document.querySelector("#securityMinLength")?.value,
      special: document.querySelector("#securitySpecial")?.value,
      twofa: document.querySelector("#security2fa")?.value,
      lockout: document.querySelector("#securityLockout")?.value
    };
    localStorage.setItem("admin_security", JSON.stringify(payload));
    if (securityStatus) securityStatus.textContent = "Security settings saved.";
  };

  const handleBackupRun = () => {
    const payload = {
      frequency: document.querySelector("#backupFrequency")?.value,
      retention: document.querySelector("#backupRetention")?.value,
      lastRun: new Date().toISOString()
    };
    localStorage.setItem("admin_backup", JSON.stringify(payload));
    if (backupStatus) backupStatus.textContent = "Backup executed locally.";
  };

  const handleBackupRestore = () => {
    if (backupStatus) backupStatus.textContent = "Restore completed locally.";
  };

  const openUserModal = () => {
    const modal = new window.bootstrap.Modal(document.getElementById("userModal"));
    modal.show();
  };

  const editUser = (index) => {
    const user = state.users[index];
    if (!user) return;
    document.querySelector("#name").value = user.name;
    document.querySelector("#email").value = user.email;
    document.querySelector("#role").value = user.role;
    document.querySelector("#password").value = "";
    document.querySelector("#editIndex").value = index;
    openUserModal();
  };

  const deleteUser = (index) => {
    if (!confirm("Delete user?")) return;
    if (state.usingApi) {
      alert("No hay endpoint para eliminar usuarios en API.");
      return;
    }

    state.users.splice(index, 1);
    localStorage.setItem("users", JSON.stringify(state.users));
    renderUsers();
  };

  const saveUser = async () => {
    const name = document.querySelector("#name").value.trim();
    const email = document.querySelector("#email").value.trim();
    const role = document.querySelector("#role").value;
    const password = document.querySelector("#password").value;
    const editIndex = document.querySelector("#editIndex").value;
    const now = new Date().toLocaleString();

    if (state.usingApi) {
      const target = state.users[editIndex] || {};
      const userId = target.id;

      if (editIndex === "") {
        if (!password) {
          alert("Password is required");
          return;
        }
        try {
          await api.apiRequest(SIGAM_CONFIG.USUARIOS_ENDPOINT, {
            method: "POST",
            body: { nombre: name, email, password, rol: role }
          });
          setStatus("User created in the API.", "success");
          await loadUsers();
        } catch {
          setStatus("Could not create user in the API.", "error");
        }
        const modal = window.bootstrap.Modal.getInstance(document.getElementById("userModal"));
        modal.hide();
        return;
      } else if (userId) {
        const updates = [];
        if (role) {
          updates.push(api.apiRequest(`${SIGAM_CONFIG.USUARIOS_ENDPOINT}/${encodeURIComponent(userId)}/rol`, {
            method: "PUT",
            body: { rol: role }
          }));
        }
        if (password) {
          updates.push(api.apiRequest(`${SIGAM_CONFIG.USUARIOS_ENDPOINT}/${encodeURIComponent(userId)}/password`, {
            method: "PUT",
            body: { password }
          }));
        }
        Promise.allSettled(updates).then(async () => {
          setStatus("User updated in the API.", "success");
          await loadUsers();
        }).catch(() => {
          setStatus("Could not update user in the API.", "error");
        });
        const modal = window.bootstrap.Modal.getInstance(document.getElementById("userModal"));
        modal.hide();
        return;
      }
    } else if (editIndex === "") {
      const exists = state.users.some(user => user.email === email);
      if (exists) {
        alert("User with this email already exists");
        return;
      }
      state.users.push({
        name,
        email,
        role,
        status: "Active",
        lastAccess: now
      });
    } else {
      state.users[editIndex].name = name;
      state.users[editIndex].email = email;
      state.users[editIndex].role = role;
    }

    localStorage.setItem("users", JSON.stringify(state.users));
    renderUsers();
    const modal = window.bootstrap.Modal.getInstance(document.getElementById("userModal"));
    modal.hide();
  };

  const bindEvents = () => {
    if (searchInput) {
      searchInput.addEventListener("input", () => renderUsers());
    }
    if (roleFilter) {
      roleFilter.addEventListener("change", () => renderUsers());
    }

    if (tabs) {
      tabs.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-section]");
        if (!btn) return;
        const key = btn.getAttribute("data-section");
        if (!key) return;
        const items = tabs.querySelectorAll(".nav-link");
        items.forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        showSection(key);
      });
    }

    if (configSave) configSave.addEventListener("click", handleConfigSave);
    if (securitySave) securitySave.addEventListener("click", handleSecuritySave);
    if (backupRun) backupRun.addEventListener("click", handleBackupRun);
    if (backupRestore) backupRestore.addEventListener("click", handleBackupRestore);

    const saveUserBtn = document.querySelector("#saveUserBtn");
    if (saveUserBtn) saveUserBtn.addEventListener("click", saveUser);

    if (userTable) {
      userTable.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-admin-action]");
        if (!button) return;
        const index = Number(button.dataset.index);
        if (Number.isNaN(index)) return;
        const action = button.dataset.adminAction;
        if (action === "edit") {
          editUser(index);
        } else if (action === "delete") {
          deleteUser(index);
        }
      });
    }
  };

  bindEvents();
  await loadUsers();
  state.refreshTimer = setInterval(() => loadUsers(), 60000);
};

const ensureBootstrapJs = () => {
  if (window.bootstrap) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sigam-bootstrap="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Bootstrap JS failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
    script.async = true;
    script.setAttribute("data-sigam-bootstrap", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Bootstrap JS failed to load"));
    document.head.appendChild(script);
  });
};

export const AdminPage = {
  render,
  init,
  meta: {
    bodyClass: "page-admin",
    roles: ROLE_ALLOWLIST
  }
};
