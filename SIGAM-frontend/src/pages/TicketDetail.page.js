import { Navbar } from "../components/Navbar.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { router } from "../router.js";
import { getUser } from "../state/storage.js";
import { normalizeCollection } from "../utils/normalize.js";
import { renderButton } from "../components/Button.js";
import "../css/pages/tickets.css";

const ROLE_ALLOWLIST = ["Gerente", "Analista", "Tecnico", "Usuario"];
const ROLE_CAN_UPDATE_STATUS = ["Gerente", "Tecnico"];
const ROLE_CAN_ASSIGN = ["Gerente"];

const render = async () => {
  const navbarHTML = Navbar.render();

  return `
    ${navbarHTML}
    <div class="container">
      <div class="header">
        <div>
          <h1>Ticket</h1>
          <p class="subtitle">Detalle del ticket y sugerencias</p>
        </div>
        ${renderButton({
          id: "backBtn",
          label: "Volver",
          variant: "primary"
        })}
      </div>

      <div class="ticket-detail">
        <div class="detail-header">
          <h2 id="detailTitle">Ticket</h2>
          <span id="detailStatus" class="ticket-status">Estado</span>
        </div>
        <div class="detail-grid">
          <div><strong>ID:</strong> <span id="detailId">-</span></div>
          <div><strong>Creado:</strong> <span id="detailCreated">-</span></div>
          <div><strong>Creado por:</strong> <span id="detailCreatedBy">-</span></div>
          <div><strong>Tipo de activo:</strong> <span id="detailAssetType">-</span></div>
          <div><strong>Activo:</strong> <span id="detailAsset">-</span></div>
          <div><strong>Categoria:</strong> <span id="detailCategory">-</span></div>
          <div><strong>Clasificacion IA:</strong> <span id="detailClassification">-</span></div>
          <div><strong>Asignado a:</strong> <span id="detailAssigned">-</span></div>
          <div><strong>Estado:</strong> <span id="detailEstado">-</span></div>
        </div>
        <div class="detail-section">
          <h3>Descripcion</h3>
          <p id="detailDescription">-</p>
        </div>
        <div class="detail-section">
          <h3>Recomendaciones de soluciones</h3>
          <div id="detailSolutions" class="detail-solutions">
            <p class="muted">Sin sugerencias por ahora.</p>
          </div>
        </div>
        <div class="detail-section" id="detailActions" hidden>
          <h3>Gestion de estado</h3>
          <div class="detail-actions" id="statusActions">
            <select id="statusSelect">
              <option value="Abierto">Abierto</option>
              <option value="Asignado">Asignado</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
            </select>
            ${renderButton({
              id: "updateStatusBtn",
              label: "Actualizar estado",
              variant: "primary"
            })}
          </div>
          <div class="detail-actions" id="assignActions">
            <select id="assignSelect">
              <option value="">Selecciona tecnico</option>
            </select>
            ${renderButton({
              id: "assignBtn",
              label: "Reasignar",
              variant: "primary"
            })}
          </div>
          <p id="detailActionStatus" class="muted"></p>
        </div>
      </div>
    </div>
  `;
};

const init = async () => {
  Navbar.init();
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      router.navigateTo("/tickets");
    });
  }
  await loadTicket();
};

const normalizeToken = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
};

const normalizeRole = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
};

const mapStatusClass = (status) => {
  const key = normalizeToken(status);
  if (key.includes("abierto")) return "status-abierto";
  if (key.includes("proceso")) return "status-en-proceso";
  if (key.includes("cerrado")) return "status-cerrado";
  if (key.includes("resuelto")) return "status-resuelto";
  return "";
};

const renderSolutions = (list) => {
  const detailSolutions = document.getElementById("detailSolutions");
  if (!detailSolutions) return;
  if (!Array.isArray(list) || list.length === 0) {
    detailSolutions.innerHTML = '<p class="muted">IA no disponible o sin respuesta.</p>';
    return;
  }
  const iaOnly = list.filter((item) => {
    if (typeof item === "string") return false;
    return Boolean(item && (item.solucion || item.pasos || item.advertencias || item.confianza !== undefined));
  });
  if (iaOnly.length === 0) {
    detailSolutions.innerHTML = '<p class="muted">IA no disponible o sin respuesta.</p>';
    return;
  }
  detailSolutions.innerHTML = iaOnly.map((item) => {
    if (typeof item === "string") {
      return `<div class="solution-card"><p>${item}</p></div>`;
    }
    const hasIaShape = item.solucion || item.pasos || item.advertencias || item.confianza !== undefined;
    if (hasIaShape) {
      const originToken = String(item.origen || "").toLowerCase();
      const originLabel =
        originToken === "ia" ? "IA" :
        originToken === "fallback" ? "Fallback" :
        originToken === "historico" ? "Historico" :
        "";
      const titulo = item.titulo || "Sugerencia IA";
      const solucion = item.solucion || "Sin solucion disponible.";
      const pasos = Array.isArray(item.pasos) && item.pasos.length
        ? `<ul>${item.pasos.map((p) => `<li>${p}</li>`).join("")}</ul>`
        : "";
      const rawCausas =
        item.causas ||
        item.posibles_causas ||
        item.causas_posibles ||
        item.root_cause ||
        item.causa_raiz ||
        [];
      const causas = Array.isArray(rawCausas) ? rawCausas.filter(Boolean) : [];
      const causasHtml = causas.length
        ? `<p class="muted">Posibles causas: ${causas.join(" • ")}</p>`
        : "";
      const advertencias = Array.isArray(item.advertencias) && item.advertencias.length
        ? `<p class="muted">Advertencias: ${item.advertencias.join(" • ")}</p>`
        : "";
      return `
        <div class="solution-card">
          <p><strong>${titulo}</strong></p>
          ${originLabel ? `<p class="muted">Origen: ${originLabel}</p>` : ""}
          <p>${solucion}</p>
          ${pasos}
          ${causasHtml}
          ${advertencias}
        </div>
      `;
    }

    return "";
  }).join("");
};

const getTicketCategoryLabel = (raw) => {
  return (
    raw.categoria_ticket ||
    raw.category ||
    raw.categoria ||
    raw.categoria_nombre ||
    ""
  );
};

const getTicketClassificationLabel = (raw) => {
  return (
    raw.clasificacion_nlp ||
    raw.classification ||
    raw.clasificacion ||
    raw.clasificacion_ia ||
    ""
  );
};

const normalizeTicket = (raw) => {
  const createdAt = raw.createdAt || raw.date || raw.created_at || raw.created_on || raw.fecha_creacion;
  const rawStatus = raw.status || raw.estado || "";
  const categoryLabel = getTicketCategoryLabel(raw);
  const classificationLabel = getTicketClassificationLabel(raw);
  const assetType =
    raw.tipo_activo ||
    raw.activo_tipo ||
    raw.tipo_equipo ||
    raw.tipo ||
    raw.modelo ||
    "";
  return {
    id: raw.id || raw._id || raw.ticketId || raw.codigo || raw.id_ticket,
    title: raw.title || raw.titulo || raw.asunto || raw.descripcion || "",
    description: raw.description || raw.descripcion || "",
    device: raw.device || raw.dispositivo || raw.activo || raw.activo_serial || "",
    category: categoryLabel,
    classification: classificationLabel,
    assetType,
    createdBy: raw.createdBy || raw.creadoPor || raw.created_by || raw.usuario_reporta || "",
    assignedTo: raw.assignedTo || raw.asignadoA || raw.assigned_to || raw.usuario_asignado || raw.tecnico_asignado || "",
    status: rawStatus,
    createdAtLabel: createdAt ? new Date(createdAt).toLocaleString() : ""
  };
};

const loadTicket = async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;
  if (!SIGAM_CONFIG.API_BASE_URL) return;

  let payload = null;
  try {
    payload = await api.apiRequest(`${SIGAM_CONFIG.TICKETS_ENDPOINT}/${encodeURIComponent(id)}?suggestions=true`);
  } catch (error) {
    payload = await api.apiRequest(`${SIGAM_CONFIG.TICKETS_ENDPOINT}/${encodeURIComponent(id)}`);
  }
  const ticket = normalizeTicket(payload || {});

  const detailTitle = document.getElementById("detailTitle");
  const detailStatus = document.getElementById("detailStatus");
  const detailId = document.getElementById("detailId");
  const detailCreated = document.getElementById("detailCreated");
  const detailCreatedBy = document.getElementById("detailCreatedBy");
  const detailAssetType = document.getElementById("detailAssetType");
  const detailAsset = document.getElementById("detailAsset");
  const detailCategory = document.getElementById("detailCategory");
  const detailClassification = document.getElementById("detailClassification");
  const detailAssigned = document.getElementById("detailAssigned");
  const detailEstado = document.getElementById("detailEstado");
  const detailDescription = document.getElementById("detailDescription");

  if (detailTitle) detailTitle.textContent = ticket.title || `Ticket #${ticket.id}`;
  if (detailStatus) {
    detailStatus.textContent = ticket.status || "Pending";
    detailStatus.className = `ticket-status ${mapStatusClass(ticket.status)}`;
  }
  if (detailId) detailId.textContent = ticket.id || "-";
  if (detailCreated) detailCreated.textContent = ticket.createdAtLabel || "-";
  if (detailCreatedBy) detailCreatedBy.textContent = ticket.createdBy || "Sin usuario";
  if (detailAssetType) detailAssetType.textContent = ticket.assetType || "Sin tipo";
  if (detailAsset) detailAsset.textContent = ticket.device || "-";
  if (detailCategory) detailCategory.textContent = ticket.category || "Sin categoria";
  if (detailClassification) detailClassification.textContent = ticket.classification || "Sin clasificacion IA";
  if (detailAssigned) detailAssigned.textContent = ticket.assignedTo || "Sin asignar";
  if (detailEstado) {
    detailEstado.textContent = ticket.status || "-";
    detailEstado.className = `ticket-status ${mapStatusClass(ticket.status)}`;
  }
  if (detailDescription) detailDescription.textContent = ticket.description || "-";

  renderSolutions(payload?.suggestions || []);
  setupActions(ticket, id);
};

const setupActions = async (ticket, ticketId) => {
  const user = getUser() || {};
  const roleRaw = user.role || user.rol || "";
  const role = normalizeRole(roleRaw);
  const canUpdate = ROLE_CAN_UPDATE_STATUS.some((r) => normalizeRole(r) === role);
  const canAssign = ROLE_CAN_ASSIGN.some((r) => normalizeRole(r) === role);

  const actionsEl = document.getElementById("detailActions");
  const statusActions = document.getElementById("statusActions");
  const assignActions = document.getElementById("assignActions");
  const statusSelect = document.getElementById("statusSelect");
  const updateStatusBtn = document.getElementById("updateStatusBtn");
  const assignSelect = document.getElementById("assignSelect");
  const assignBtn = document.getElementById("assignBtn");
  const actionStatus = document.getElementById("detailActionStatus");

  if (!actionsEl) return;

  actionsEl.hidden = !(canUpdate || canAssign);

  if (!canUpdate && statusActions) statusActions.style.display = "none";
  if (!canAssign && assignActions) assignActions.style.display = "none";

  if (statusSelect && ticket.status) {
    statusSelect.value = ticket.status;
  }

  const setActionStatus = (message, type) => {
    if (!actionStatus) return;
    actionStatus.textContent = message || "";
    actionStatus.className = "muted";
    if (type === "error") actionStatus.classList.add("text-danger");
    if (type === "success") actionStatus.classList.add("text-success");
  };

  if (canUpdate && updateStatusBtn && statusSelect) {
    updateStatusBtn.addEventListener("click", async () => {
      const nextStatus = statusSelect.value;
      if (!nextStatus) return;
      setActionStatus("Actualizando estado...", "loading");
      try {
        const payload = await api.apiRequest(`${SIGAM_CONFIG.TICKETS_ENDPOINT}/${encodeURIComponent(ticketId)}/estado`, {
          method: "PATCH",
          body: { estado: nextStatus }
        });
        const updated = normalizeTicket(payload || ticket);
        const detailStatus = document.getElementById("detailStatus");
        const detailEstado = document.getElementById("detailEstado");
        if (detailStatus) {
          detailStatus.textContent = updated.status || nextStatus;
          detailStatus.className = `ticket-status ${mapStatusClass(updated.status || nextStatus)}`;
        }
        if (detailEstado) detailEstado.textContent = updated.status || nextStatus;
        setActionStatus("Estado actualizado.", "success");
      } catch (error) {
        setActionStatus("No se pudo actualizar el estado.", "error");
      }
    });
  }

  if (canAssign && assignSelect && assignBtn) {
    try {
      const payload = await api.apiRequest(`${SIGAM_CONFIG.USUARIOS_ENDPOINT}?limit=200&offset=0`);
      const users = normalizeCollection(payload);
      const options = users
        .filter((item) => normalizeRole(item.rol || item.role) === "tecnico")
        .map((item) => ({
          id: item.id_usuario || item.id,
          label: item.nombre || item.name || item.email || `Usuario ${item.id_usuario || item.id}`
        }))
        .filter((item) => item.id);
      assignSelect.innerHTML = '<option value=\"\">Selecciona tecnico</option>' + options
        .map((item) => `<option value=\"${item.id}\">${item.label}</option>`)
        .join("");
    } catch {
      assignSelect.innerHTML = '<option value=\"\">Sin tecnicos disponibles</option>';
    }

    assignBtn.addEventListener("click", async () => {
      const tecnicoId = assignSelect.value;
      if (!tecnicoId) return;
      setActionStatus("Reasignando ticket...", "loading");
      try {
        await api.apiRequest(`${SIGAM_CONFIG.TICKETS_ENDPOINT}/${encodeURIComponent(ticketId)}/asignar`, {
          method: "POST",
          body: { id_usuario_tecnico: Number(tecnicoId) || tecnicoId }
        });
        const detailAssigned = document.getElementById("detailAssigned");
        const selected = assignSelect.options[assignSelect.selectedIndex];
        if (detailAssigned && selected) detailAssigned.textContent = selected.textContent;
        setActionStatus("Ticket reasignado.", "success");
      } catch (error) {
        setActionStatus("No se pudo reasignar el ticket.", "error");
      }
    });
  }
};

export const TicketDetailPage = {
  render,
  init,
  meta: {
    bodyClass: "page-tickets",
    roles: ROLE_ALLOWLIST
  }
};
