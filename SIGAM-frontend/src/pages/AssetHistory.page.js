import { Navbar } from "../components/Navbar.js";
import { renderButton } from "../components/Button.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { router } from "../router.js";
import { normalizeCollection } from "../utils/normalize.js";
import "../css/pages/asset-history.css";

const ROLE_ALLOWLIST = ["Gerente", "Analista", "Tecnico", "Auditor"];
const consumoCache = new Map();
const licenseAssignmentsCache = new Map();
let currentAssetId = null;
let usersCache = [];
let ubicacionesCache = [];
let softwareCatalogCache = [];

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const getErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error.message === "string" && error.message.trim()) return error.message;
  if (error.payload && typeof error.payload.message === "string" && error.payload.message.trim()) {
    return error.payload.message;
  }
  return fallback;
};

const bindOnce = (element, key, handler, options) => {
  if (!element) return;
  const flag = `bound${key}`;
  if (element.dataset[flag] === "true") return;
  element.dataset[flag] = "true";
  element.addEventListener("click", handler, options);
};

const bindSubmitOnce = (element, key, handler) => {
  if (!element) return;
  const flag = `bound${key}`;
  if (element.dataset[flag] === "true") return;
  element.dataset[flag] = "true";
  element.addEventListener("submit", handler);
};

const uniqueBy = (items = [], getKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const setActionStatus = (elementId, message, type = "info") => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message || "";
  el.className = "small";
  if (type === "error") el.classList.add("text-danger");
  if (type === "success") el.classList.add("text-success");
  if (type === "info") el.classList.add("text-muted");
};

const fillSelect = (select, items, getValue, getLabel, placeholder) => {
  if (!select) return;
  const options = (items || []).map((item) => {
    const value = getValue(item);
    const label = getLabel(item);
    return `<option value="${value}">${label}</option>`;
  });
  select.innerHTML = `<option value="">${placeholder}</option>` + options.join("");
};

const formatDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffInMonths = (start, end = new Date()) => {
  if (!start) return 0;
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  const total = years * 12 + months;
  return total < 0 ? 0 : total;
};

const formatDuration = (ms) => {
  if (!ms || ms < 0) return "-";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0 && minutes === 0) return "menos de 1 min";
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
};

const getAssetIdFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
};

const setStatusMessage = (message, level = "info") => {
  const statusEl = document.getElementById("assetHistoryStatus");
  if (!statusEl) return;
  if (!message) {
    statusEl.classList.add("d-none");
    return;
  }
  statusEl.textContent = message;
  statusEl.className = `alert alert-${level}`;
  statusEl.classList.remove("d-none");
};

const highlightObsolescence = (months) => {
  const alertEl = document.getElementById("assetObsolescenceAlert");
  if (!alertEl) return;
  if (months >= 48) {
    alertEl.textContent = `Este activo supera los ${months} meses de vida útil. Recomendado revisar renovación.`;
    alertEl.className = "asset-history-alert alert alert-warning";
    alertEl.classList.remove("d-none");
    return;
  }
  alertEl.textContent = "Activo dentro del ciclo operativo esperado.";
  alertEl.className = "asset-history-alert alert alert-success";
  alertEl.classList.remove("d-none");
};

const mapMaintenanceRecord = (item) => {
  const start = parseDate(item.fecha_inicio || item.startDate);
  const end = parseDate(item.fecha_fin || item.endDate || item.fecha_finalizacion);
  return {
    maintenanceId: item.id_orden || item.id || item.orden_id || null,
    start,
    end,
    technician: item.usuarios?.nombre || item.tecnico?.nombre || item.usuario_tecnico || item.tecnico_nombre || "Sin técnico",
    ticketId: item.id_ticket || item.tickets?.id_ticket || "-",
    title: item.tickets?.tipo_ticket || item.tipo || "Mantenimiento",
    status: item.tickets?.estado || item.estado || "-",
    description: item.tickets?.descripcion || item.diagnostico || "Sin descripción",
    actions: item.acciones_realizadas || item.actions || "Sin acciones registradas",
    parts: Array.isArray(item.repuestos) ? item.repuestos : [],
    assetId: item.tickets?.id_activo || item.ticket_id_activo || item.id_activo || item.assetId || null
  };
};

const computeReliability = (records) => {
  const durations = records
    .map((record) => {
      if (record.start && record.end) {
        return record.end - record.start;
      }
      return null;
    })
    .filter((value) => value !== null);

  const mttr = durations.length
    ? durations.reduce((acc, value) => acc + value, 0) / durations.length
    : null;

  const sorted = records
    .filter((record) => record.start)
    .sort((a, b) => a.start - b.start);
  const intervals = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const previousEnd = sorted[i - 1].end;
    const currentStart = sorted[i].start;
    if (previousEnd && currentStart && currentStart > previousEnd) {
      intervals.push(currentStart - previousEnd);
    }
  }

  const mtbf = intervals.length
    ? intervals.reduce((acc, value) => acc + value, 0) / intervals.length
    : null;

  return { mttr, mtbf };
};

const renderMaintenanceTimeline = (records) => {
  const container = document.getElementById("assetMaintenanceTimeline");
  if (!container) return;
  if (!records.length) {
    container.innerHTML = '<p class="text-muted">No hay mantenimientos registrados para este activo.</p>';
    return;
  }
  container.innerHTML = records
    .map((record) => {
      const startLabel = formatDateLabel(record.start);
      const endLabel = record.end ? formatDateLabel(record.end) : "En curso";
      const parts = record.parts.length
        ? `<p class="text-muted small">Repuestos: ${record.parts.map((part) => part.nombre || part.name || part).join(" • ")}</p>`
        : "";
      const consumosId = record.maintenanceId ? String(record.maintenanceId) : "";
      const consumosBtn = consumosId
        ? `<button class="btn btn-sm btn-outline-primary mt-2" data-maintenance-consumos="${consumosId}">Ver repuestos</button>`
        : "";
      const consumosContainer = consumosId
        ? `<div class="asset-history-consumos" data-consumos-container="${consumosId}"></div>`
        : "";
      return `
        <article class="asset-history-record">
          <header>
            <p class="text-muted mb-1">${startLabel} / ${endLabel}</p>
            <strong>#${record.ticketId} · ${record.title}</strong>
          </header>
          <p class="mb-1">${record.description}</p>
          <p class="mb-1"><strong>Técnico:</strong> ${record.technician}</p>
          <p class="mb-1"><strong>Estado:</strong> ${record.status}</p>
          <p class="text-muted small">Acciones: ${record.actions}</p>
          ${parts}
          ${consumosBtn}
          ${consumosContainer}
        </article>
      `;
    })
    .join("");
};

const renderCustodySummary = (asset, assignments, records) => {
  const container = document.getElementById("assetCustodyCurrent");
  if (!container) return;
  const assigned = asset.asignado_a || asset.assigned || asset.custodio || "Sin responsable";
  const technicians = Array.from(
    new Set(records.map((record) => record.technician).filter(Boolean))
  );
  container.innerHTML = `
    <p class="mb-1"><strong>Custodia actual:</strong> ${assigned}</p>
    <p class="mb-0"><strong>Técnicos involucrados:</strong> ${technicians.join(" • ") || "Sin historial"}</p>
  `;

  const listEl = document.getElementById("assetAssignmentsList");
  if (!listEl) return;
  if (!assignments.length) {
    listEl.innerHTML = '<p class="text-muted">No hay asignaciones registradas.</p>';
    return;
  }
  listEl.innerHTML = assignments.map((entry) => {
    const userName = entry.usuario_nombre || entry.usuarios?.nombre || entry.nombre || "Sin usuario";
    const start = formatDateLabel(entry.fecha_asignacion || entry.fecha_inicio || entry.created_at);
    const endValue = entry.fecha_fin || entry.fecha_cierre || entry.fin;
    const end = endValue ? formatDateLabel(endValue) : "Actual";
    const assignmentId = entry.id_asignacion || entry.id || entry.asignacion_id;
    const isActive = entry.activo === true || (!endValue && end === "Actual");
    const endBtn = isActive && assignmentId
      ? `<button class="btn btn-sm btn-outline-secondary" data-assignment-end="${assignmentId}">Finalizar</button>`
      : "";
    return `
      <div class="asset-history-assignment">
        <div>
          <strong>${userName}</strong>
          <span class="text-muted d-block">${start} · ${end}</span>
        </div>
        ${endBtn}
      </div>
    `;
  }).join("");
};

const renderLifecycle = (asset) => {
  const acquisitionEl = document.getElementById("assetLifecycleAcquisition");
  const warrantyEl = document.getElementById("assetLifecycleWarranty");
  const obsolescenceEl = document.getElementById("assetLifecycleObsolescence");
  const usedEl = document.getElementById("assetLifecycleUsedMonths");
  const acquisitionDate = asset.fecha_compra || asset.fecha_adquisicion || asset.created_at || asset.ingreso || null;
  const parsedAcquisition = parseDate(acquisitionDate);
  if (acquisitionEl) acquisitionEl.textContent = formatDateLabel(parsedAcquisition) || "Sin fecha";
  if (warrantyEl) {
    const lifeSpan = asset["vida_util"] || asset.lifeSpan || "";
    const warrantyValue = asset.warranty || (lifeSpan ? `${lifeSpan} meses` : asset.estado_vida_util || "No definido");
    warrantyEl.textContent = warrantyValue;
  }
  if (obsolescenceEl) {
    let obsolescenceDate = asset.fecha_obsolescencia || asset.fecha_obsolescencia_estimada || null;
    if (!obsolescenceDate && parsedAcquisition && asset.vida_util) {
      const months = Number(asset.vida_util);
      if (Number.isFinite(months)) {
        const next = new Date(parsedAcquisition);
        next.setMonth(next.getMonth() + months);
        obsolescenceDate = next;
      }
    }
    obsolescenceEl.textContent = formatDateLabel(obsolescenceDate) || "No definido";
  }
  if (usedEl) {
    const monthsUsed = parsedAcquisition ? diffInMonths(parsedAcquisition) : 0;
    usedEl.textContent = `${monthsUsed} meses de uso`; 
    if (parsedAcquisition) {
      highlightObsolescence(monthsUsed);
    }
  }
};

const renderAssetSpecs = (asset) => {
  const locationEl = document.getElementById("assetSpecLocation");
  const providerEl = document.getElementById("assetSpecProvider");
  const electricalEl = document.getElementById("assetSpecElectrical");
  const serialEl = document.getElementById("assetSpecSerial");
  const typeEl = document.getElementById("assetSpecType");
  const statusEl = document.getElementById("assetSpecStatus");
  const locationParts = [asset.sede, asset.piso, asset.sala].filter(Boolean);
  const locationValue = locationParts.length
    ? locationParts.join(" > ")
    : asset.location || asset.ubicacion || "Sin ubicación";
  if (locationEl) locationEl.textContent = locationValue;
  if (providerEl) providerEl.textContent = asset.proveedor || asset.provider || asset.proveedor_nombre || "Sin proveedor";
  if (electricalEl) electricalEl.textContent = asset.especificaciones_electricas || asset.especificaciones || asset.specs || "No disponible";
  if (serialEl) serialEl.textContent = asset.serial || asset.serie || "Sin serial";
  if (typeEl) typeEl.textContent = asset.tipo_activo || asset.tipo || asset.type || "Sin categoría";
  if (statusEl) statusEl.textContent = asset.estado_vida_util || asset.estado || asset.status || "Desconocido";
};

const renderReliabilityMetrics = (metrics) => {
  const mttrEl = document.getElementById("assetMetricMTTR");
  const mtbfEl = document.getElementById("assetMetricMTBF");
  if (mttrEl) {
    mttrEl.textContent = metrics.mttr ? formatDuration(metrics.mttr) : "N/A";
  }
  if (mtbfEl) {
    mtbfEl.textContent = metrics.mtbf ? formatDuration(metrics.mtbf) : "N/A";
  }
};

const renderHistoryEvents = (history) => {
  const container = document.getElementById("assetHistoryEvents");
  if (!container) return;
  if (!history.length) {
    container.innerHTML = '<p class="text-muted">No hay eventos registrados.</p>';
    return;
  }
  container.innerHTML = history.map((entry) => {
    const when = formatDateLabel(entry.fecha_evento || entry.fecha || entry.created_at);
    const type = entry.tipo_evento || entry.tipo || "Evento";
    const detail = entry.detalle || entry.descripcion || "";
    return `
      <div class="asset-history-event">
        <strong>${type}</strong>
        <span class="text-muted">${when}</span>
        <p class="mb-0">${detail || "Sin detalle adicional."}</p>
      </div>
    `;
  }).join("");
};

const renderDisposition = (documents = []) => {
  const certificateEl = document.getElementById("assetDisposalCertificate");
  const messageEl = document.getElementById("assetDisposalMessage");
  if (!certificateEl || !messageEl) return;
  const normalizedDocs = Array.isArray(documents) ? documents : [];
  const certificateDoc = normalizedDocs.find((doc) => {
    const key = normalizeText(doc.nombre || doc.tipo || doc.name || doc.type || "");
    return key.includes("borrado") || key.includes("certificado");
  });
  if (!certificateDoc) {
    messageEl.textContent = "Activo en operación. No se encontró certificado de borrado.";
    certificateEl.textContent = "Sin certificado";
    return;
  }
  const label = certificateDoc.nombre || certificateDoc.tipo || "Certificado de borrado";
  messageEl.textContent = "Certificado de borrado registrado.";
  if (certificateDoc.url) {
    certificateEl.innerHTML = `<a href="${certificateDoc.url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  } else {
    certificateEl.textContent = label;
  }
};

const renderDocumentsList = (documents = []) => {
  const container = document.getElementById("assetDocumentsList");
  if (!container) return;
  const uniqueDocs = uniqueBy(documents, (doc) => {
    const name = doc.nombre || doc.tipo || doc.name || "";
    const url = doc.url || "";
    return `${name}::${url}`.trim();
  });
  if (!uniqueDocs.length) {
    container.innerHTML = '<p class="text-muted">No hay documentos cargados.</p>';
    return;
  }
  container.innerHTML = uniqueDocs.map((doc) => {
    const name = doc.nombre || doc.tipo || doc.name || "Documento";
    if (doc.url) {
      return `<div class="asset-history-document"><a href="${doc.url}" target="_blank" rel="noopener noreferrer">${name}</a></div>`;
    }
    return `<div class="asset-history-document">${name}</div>`;
  }).join("");
};

const renderSoftwareList = (list = []) => {
  const container = document.getElementById("assetSoftwareList");
  if (!container) return;
  const uniqueList = uniqueBy(list, (item) => String(item.id_software || item.software?.id_software || item.id || item.software_id || ""));
  if (!uniqueList.length) {
    container.innerHTML = '<p class="text-muted">No hay software asignado.</p>';
    return;
  }
  container.innerHTML = uniqueList.map((item) => {
    const name =
      item.nombre ||
      item.name ||
      item.software?.nombre ||
      item.software?.name ||
      item.software?.software ||
      (typeof item.software === "string" ? item.software : "") ||
      "Software";
    const id = item.id_software || item.software?.id_software || item.id || item.software_id;
    return `
      <div class="asset-history-software-row">
        <span>${name}</span>
        <button class="btn btn-sm btn-outline-danger" data-software-remove="${id}">Quitar</button>
      </div>
    `;
  }).join("");
};

const renderLicenseList = (assignments = []) => {
  const container = document.getElementById("assetLicenseList");
  if (!container) return;
  const uniqueAssignments = uniqueBy(assignments, (item) => String(item.id_asignacion || item.id_asignacion_licencia || item.id_asignacion_lic || ""));
  if (!uniqueAssignments.length) {
    container.innerHTML = '<p class="text-muted">No hay licencias asignadas al activo.</p>';
    return;
  }
  container.innerHTML = uniqueAssignments.map((item) => {
    const label = item.licencia_label || item.clave_producto || `Licencia #${item.id_licencia || item.id}`;
    const assignmentId = item.id_asignacion || item.id_asignacion_licencia || item.id_asignacion_lic;
    return `
      <div class="asset-history-license-row">
        <span>${label}</span>
        <button class="btn btn-sm btn-outline-danger" data-license-revoke="${assignmentId}">Revocar</button>
      </div>
    `;
  }).join("");
};

const renderAssetHistory = (asset, maintenanceRecords, history, assignments, documents) => {
  setStatusMessage("", "info");
  const titleEl = document.getElementById("assetHistoryTitle");
  const subtitleEl = document.getElementById("assetHistorySubtitle");
  if (titleEl) {
    titleEl.textContent = asset.modelo || asset.name || `Activo ${asset.id}`;
  }
  if (subtitleEl) {
    subtitleEl.textContent = asset.descripcion || asset.description || "Hoja de vida del activo";
  }
  renderAssetSpecs(asset);
  renderLifecycle(asset);
  renderCustodySummary(asset, assignments, maintenanceRecords);
  renderMaintenanceTimeline(maintenanceRecords);
  bindConsumosHandlers();
  renderHistoryEvents(history);
  const metrics = computeReliability(maintenanceRecords);
  renderReliabilityMetrics(metrics);
  renderDisposition(documents);
};

const fetchAssetDetail = async (assetId) => {
  if (!SIGAM_CONFIG.API_BASE_URL) return null;
  const path = `${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}`;
  try {
    const payload = await api.apiRequest(path);
    return payload || null;
  } catch (error) {
    return null;
  }
};

const fetchMaintenances = async () => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT);
    return normalizeCollection(payload)
      .map(mapMaintenanceRecord)
      .filter(Boolean)
      .sort((a, b) => (b.start || 0) - (a.start || 0));
  } catch (error) {
    return [];
  }
};

const fetchUsers = async () => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(SIGAM_CONFIG.USUARIOS_ENDPOINT);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchUbicaciones = async () => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(SIGAM_CONFIG.UBICACIONES_ENDPOINT);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchSoftwareCatalog = async () => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(SIGAM_CONFIG.SOFTWARE_ENDPOINT);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchSoftwareByAsset = async (assetId) => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(`${SIGAM_CONFIG.SOFTWARE_ENDPOINT}/activo/${encodeURIComponent(assetId)}`);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchLicencias = async () => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(SIGAM_CONFIG.LICENCIAS_ENDPOINT);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchLicenciaAsignaciones = async (licenseId) => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(`${SIGAM_CONFIG.LICENCIAS_ENDPOINT}/${encodeURIComponent(licenseId)}/asignaciones`);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchAssetHistory = async (assetId) => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}/historial`);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchAssignments = async (assetId) => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}/asignaciones`);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const fetchDocuments = async (assetId) => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}/documentos`);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const assignUserToAsset = async (assetId, userId) => {
  return api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}/asignar`, {
    method: "POST",
    body: { id_usuario: Number(userId) || userId }
  });
};

const unassignUserFromAsset = async (assignmentId) => {
  return api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/asignaciones/${encodeURIComponent(assignmentId)}/fin`, {
    method: "PATCH"
  });
};

const updateAssetLocation = async (assetId, locationId) => {
  return api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}`, {
    method: "PUT",
    body: { id_ubicacion: Number(locationId) || locationId }
  });
};

const addAssetDocument = async (assetId, payload) => {
  return api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}/documentos`, {
    method: "POST",
    body: payload
  });
};

const retireAsset = async (assetId, payload) => {
  return api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
    body: payload
  });
};

const assignSoftwareToAsset = async (softwareId, assetId) => {
  return api.apiRequest(`${SIGAM_CONFIG.SOFTWARE_ENDPOINT}/${encodeURIComponent(softwareId)}/asignar`, {
    method: "POST",
    body: { id_activo: Number(assetId) || assetId }
  });
};

const removeSoftwareFromAsset = async (softwareId, assetId) => {
  return api.apiRequest(`${SIGAM_CONFIG.SOFTWARE_ENDPOINT}/${encodeURIComponent(softwareId)}/activo/${encodeURIComponent(assetId)}`, {
    method: "DELETE"
  });
};

const assignLicenseToAsset = async (licenseId, assetId) => {
  return api.apiRequest(`${SIGAM_CONFIG.LICENCIAS_ENDPOINT}/asignar`, {
    method: "POST",
    body: { id_licencia: Number(licenseId) || licenseId, id_activo: Number(assetId) || assetId }
  });
};

const revokeLicenseAssignment = async (assignmentId) => {
  return api.apiRequest(`${SIGAM_CONFIG.LICENCIAS_ENDPOINT}/asignacion/${encodeURIComponent(assignmentId)}`, {
    method: "DELETE"
  });
};

const fetchMaintenanceConsumos = async (maintenanceId) => {
  if (!SIGAM_CONFIG.API_BASE_URL) return [];
  try {
    const payload = await api.apiRequest(`${SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT}/${encodeURIComponent(maintenanceId)}/consumos`);
    return normalizeCollection(payload) || [];
  } catch (error) {
    return [];
  }
};

const renderConsumos = (container, items) => {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<p class="text-muted small">Sin repuestos registrados.</p>';
    return;
  }
  const list = items.map((item) => {
    const name = item.nombre || item.repuesto?.nombre || item.descripcion || `Repuesto #${item.id_repuesto || item.id || ""}`;
    const qty = item.cantidad_usada || item.cantidad || item.qty || 1;
    return `<li>${name} · ${qty}</li>`;
  }).join("");
  container.innerHTML = `<ul class="asset-history-consumos-list">${list}</ul>`;
};

const bindConsumosHandlers = () => {
  const container = document.getElementById("assetMaintenanceTimeline");
  if (!container) return;
  if (container.dataset.boundConsumos === "true") return;
  container.dataset.boundConsumos = "true";
  container.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-maintenance-consumos]");
    if (!btn) return;
    const maintenanceId = btn.dataset.maintenanceConsumos;
    if (!maintenanceId) return;
    const target = container.querySelector(`[data-consumos-container="${maintenanceId}"]`);
    if (!target) return;
    if (consumoCache.has(maintenanceId)) {
      renderConsumos(target, consumoCache.get(maintenanceId));
      return;
    }
    target.innerHTML = '<p class="text-muted small">Cargando repuestos...</p>';
    const items = await fetchMaintenanceConsumos(maintenanceId);
    consumoCache.set(maintenanceId, items);
    renderConsumos(target, items);
  });
};

const buildLicenseAssignmentsForAsset = async (licenses, assetId) => {
  if (!Array.isArray(licenses) || !licenses.length) return [];
  const results = [];
  await Promise.all(licenses.map(async (license) => {
    const licenseId = license.id_licencia || license.id || license.licencia_id;
    if (!licenseId) return;
    let assignments = licenseAssignmentsCache.get(String(licenseId));
    if (!assignments) {
      assignments = await fetchLicenciaAsignaciones(licenseId);
      licenseAssignmentsCache.set(String(licenseId), assignments);
    }
    (assignments || []).forEach((assignment) => {
      const assignedAsset = assignment.id_activo || assignment.activo_id;
      if (String(assignedAsset) !== String(assetId)) return;
      results.push({
        id_asignacion: assignment.id_asignacion || assignment.id || assignment.asignacion_id,
        id_licencia: licenseId,
        clave_producto: license.clave_producto || assignment.clave_producto || "Licencia",
        licencia_label: license.software
          ? `${license.software} · ${license.clave_producto || ""}`.trim()
          : license.clave_producto || `Licencia #${licenseId}`
      });
    });
  }));
  return results;
};

const hydrateAssetPanels = async ({ asset, assignments, documents, softwareAssigned, licenses }) => {
  const assetId = asset.id_activo || asset.id || asset.idActivo || asset.codigo;
  const userSelect = document.getElementById("assetAssignUserSelect");
  const locationSelect = document.getElementById("assetLocationSelect");
  const softwareSelect = document.getElementById("assetSoftwareSelect");
  const licenseSelect = document.getElementById("assetLicenseSelect");
  const uniqueUsers = uniqueBy(usersCache, (user) => String(user.id_usuario || user.id || ""));
  const uniqueLocations = uniqueBy(ubicacionesCache, (loc) => String(loc.id_ubicacion || loc.id || ""));
  const uniqueSoftware = uniqueBy(softwareCatalogCache, (item) => String(item.id_software || item.id || ""));
  const uniqueLicenses = uniqueBy(licenses, (item) => String(item.id_licencia || item.id || ""));

  fillSelect(
    userSelect,
    uniqueUsers,
    (user) => user.id_usuario || user.id,
    (user) => user.nombre || user.name || `Usuario ${user.id_usuario || user.id}`,
    "Selecciona un usuario"
  );

  fillSelect(
    locationSelect,
    uniqueLocations,
    (loc) => loc.id_ubicacion || loc.id,
    (loc) => [loc.sede, loc.piso, loc.sala].filter(Boolean).join(" > ") || `Ubicación ${loc.id_ubicacion || loc.id}`,
    "Selecciona ubicación"
  );

  fillSelect(
    softwareSelect,
    uniqueSoftware,
    (item) => item.id_software || item.id,
    (item) => item.nombre || item.name || `Software ${item.id_software || item.id}`,
    "Selecciona software"
  );

  fillSelect(
    licenseSelect,
    uniqueLicenses,
    (item) => item.id_licencia || item.id,
    (item) => item.software ? `${item.software} · ${item.clave_producto || item.id_licencia}` : item.clave_producto || `Licencia ${item.id_licencia || item.id}`,
    "Selecciona licencia"
  );

  renderDocumentsList(documents);
  renderSoftwareList(softwareAssigned);

  const licenseAssignments = await buildLicenseAssignmentsForAsset(uniqueLicenses, assetId);
  renderLicenseList(licenseAssignments);

  bindActionHandlers({
    assetId,
    assignments,
    documents,
    softwareAssigned,
    licenses,
    licenseAssignments
  });
};

const bindActionHandlers = ({
  assetId,
  assignments,
  documents,
  softwareAssigned,
  licenses,
  licenseAssignments
}) => {
  const activeAssignmentUserIds = new Set(
    (assignments || [])
      .filter((entry) => entry.activo === true || (!entry.fecha_fin && !entry.fin && !entry.fecha_cierre))
      .map((entry) => String(entry.id_usuario || entry.usuario_id || entry.id_usuario_asignado || ""))
      .filter(Boolean)
  );
  const assignedSoftwareIds = new Set(
    (softwareAssigned || [])
      .map((item) => String(item.id_software || item.id || item.software_id || ""))
      .filter(Boolean)
  );
  const assignedLicenseIds = new Set(
    (licenseAssignments || [])
      .map((item) => String(item.id_licencia || item.id || ""))
      .filter(Boolean)
  );
  const assignUserBtn = document.getElementById("assetAssignUserBtn");
  const assignUserSelect = document.getElementById("assetAssignUserSelect");
  const assignUserStatus = "assetAssignUserStatus";
  const locationBtn = document.getElementById("assetLocationSaveBtn");
  const locationSelect = document.getElementById("assetLocationSelect");
  const locationStatus = "assetLocationStatus";
  const documentForm = document.getElementById("assetDocumentForm");
  const softwareBtn = document.getElementById("assetSoftwareAssignBtn");
  const softwareSelect = document.getElementById("assetSoftwareSelect");
  const licenseBtn = document.getElementById("assetLicenseAssignBtn");
  const licenseSelect = document.getElementById("assetLicenseSelect");
  const retireForm = document.getElementById("assetRetireForm");

  if (assignUserBtn && assignUserSelect) {
    bindOnce(assignUserBtn, "AssignUser", async () => {
      const userId = assignUserSelect.value;
      if (!userId) {
        setActionStatus(assignUserStatus, "Selecciona un usuario.", "error");
        return;
      }
      if (activeAssignmentUserIds.has(String(userId))) {
        setActionStatus(assignUserStatus, "Ese usuario ya está asignado al activo.", "error");
        return;
      }
      setActionStatus(assignUserStatus, "Asignando...", "info");
      try {
        await assignUserToAsset(assetId, userId);
        setActionStatus(assignUserStatus, "Usuario asignado correctamente.", "success");
        await loadAssetHistory();
      } catch (error) {
        setActionStatus(assignUserStatus, getErrorMessage(error, "No se pudo asignar el usuario."), "error");
      }
    });
  }

  const assignmentsContainer = document.getElementById("assetAssignmentsList");
  if (assignmentsContainer) {
    if (assignmentsContainer.dataset.boundAssignments === "true") return;
    assignmentsContainer.dataset.boundAssignments = "true";
    assignmentsContainer.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-assignment-end]");
      if (!button) return;
      const assignmentId = button.dataset.assignmentEnd;
      setActionStatus(assignUserStatus, "Finalizando asignación...", "info");
      try {
        await unassignUserFromAsset(assignmentId);
        setActionStatus(assignUserStatus, "Asignación finalizada.", "success");
        await loadAssetHistory();
      } catch (error) {
        setActionStatus(assignUserStatus, getErrorMessage(error, "No se pudo finalizar la asignación."), "error");
      }
    });
  }

  if (locationBtn && locationSelect) {
    bindOnce(locationBtn, "Location", async () => {
      const locationId = locationSelect.value;
      if (!locationId) {
        setActionStatus(locationStatus, "Selecciona una ubicación.", "error");
        return;
      }
      setActionStatus(locationStatus, "Actualizando ubicación...", "info");
      try {
        await updateAssetLocation(assetId, locationId);
        setActionStatus(locationStatus, "Ubicación actualizada.", "success");
        await loadAssetHistory();
      } catch (error) {
        setActionStatus(locationStatus, getErrorMessage(error, "No se pudo actualizar la ubicación."), "error");
      }
    });
  }

  if (documentForm) {
    bindSubmitOnce(documentForm, "Documents", async (event) => {
      event.preventDefault();
      const nameInput = document.getElementById("assetDocumentName");
      const typeInput = document.getElementById("assetDocumentType");
      const urlInput = document.getElementById("assetDocumentUrl");
      const statusId = "assetDocumentStatus";
      if (!nameInput || !urlInput) return;
      if (!nameInput.value.trim() || !urlInput.value.trim()) {
        setActionStatus(statusId, "Nombre y URL son obligatorios.", "error");
        return;
      }
      setActionStatus(statusId, "Guardando documento...", "info");
      try {
        await addAssetDocument(assetId, {
          nombre: nameInput.value.trim(),
          tipo: typeInput ? typeInput.value.trim() : "",
          url: urlInput.value.trim()
        });
        setActionStatus(statusId, "Documento agregado.", "success");
        nameInput.value = "";
        if (typeInput) typeInput.value = "";
        urlInput.value = "";
        await loadAssetHistory();
      } catch (error) {
        setActionStatus(statusId, getErrorMessage(error, "No se pudo agregar el documento."), "error");
      }
    });
  }

  if (softwareBtn && softwareSelect) {
    bindOnce(softwareBtn, "SoftwareAssign", async () => {
      const softwareId = softwareSelect.value;
      if (!softwareId) {
        setActionStatus("assetSoftwareStatus", "Selecciona un software.", "error");
        return;
      }
      if (assignedSoftwareIds.has(String(softwareId))) {
        setActionStatus("assetSoftwareStatus", "Ese software ya está asignado.", "error");
        return;
      }
      setActionStatus("assetSoftwareStatus", "Asignando software...", "info");
      try {
        await assignSoftwareToAsset(softwareId, assetId);
        setActionStatus("assetSoftwareStatus", "Software asignado.", "success");
        await loadAssetHistory();
      } catch (error) {
        setActionStatus("assetSoftwareStatus", getErrorMessage(error, "No se pudo asignar el software."), "error");
      }
    });
  }

  const softwareList = document.getElementById("assetSoftwareList");
  if (softwareList) {
    if (softwareList.dataset.boundSoftwareList === "true") return;
    softwareList.dataset.boundSoftwareList = "true";
    softwareList.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-software-remove]");
      if (!btn) return;
      const softwareId = btn.dataset.softwareRemove;
      setActionStatus("assetSoftwareStatus", "Quitando software...", "info");
      try {
        await removeSoftwareFromAsset(softwareId, assetId);
        setActionStatus("assetSoftwareStatus", "Software removido.", "success");
        await loadAssetHistory();
      } catch (error) {
        setActionStatus("assetSoftwareStatus", getErrorMessage(error, "No se pudo remover el software."), "error");
      }
    });
  }

  if (licenseBtn && licenseSelect) {
    bindOnce(licenseBtn, "LicenseAssign", async () => {
      const licenseId = licenseSelect.value;
      if (!licenseId) {
        setActionStatus("assetLicenseStatus", "Selecciona una licencia.", "error");
        return;
      }
      if (assignedLicenseIds.has(String(licenseId))) {
        setActionStatus("assetLicenseStatus", "Esa licencia ya está asignada.", "error");
        return;
      }
      setActionStatus("assetLicenseStatus", "Asignando licencia...", "info");
      try {
        await assignLicenseToAsset(licenseId, assetId);
        licenseAssignmentsCache.delete(String(licenseId));
        setActionStatus("assetLicenseStatus", "Licencia asignada.", "success");
        await loadAssetHistory();
      } catch (error) {
        setActionStatus("assetLicenseStatus", getErrorMessage(error, "No se pudo asignar la licencia."), "error");
      }
    });
  }

  const licenseList = document.getElementById("assetLicenseList");
  if (licenseList) {
    if (licenseList.dataset.boundLicenseList === "true") return;
    licenseList.dataset.boundLicenseList = "true";
    licenseList.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-license-revoke]");
      if (!btn) return;
      const assignmentId = btn.dataset.licenseRevoke;
      setActionStatus("assetLicenseStatus", "Revocando licencia...", "info");
      try {
        await revokeLicenseAssignment(assignmentId);
        setActionStatus("assetLicenseStatus", "Licencia revocada.", "success");
        licenseAssignmentsCache.clear();
        await loadAssetHistory();
      } catch (error) {
        setActionStatus("assetLicenseStatus", getErrorMessage(error, "No se pudo revocar la licencia."), "error");
      }
    });
  }

  if (retireForm) {
    bindSubmitOnce(retireForm, "Retire", async (event) => {
      event.preventDefault();
      const motivoInput = document.getElementById("assetRetireReason");
      const certificadoInput = document.getElementById("assetRetireCertificate");
      if (!motivoInput || !certificadoInput) return;
      if (!motivoInput.value.trim() || !certificadoInput.value.trim()) {
        setActionStatus("assetRetireStatus", "Motivo y certificado son obligatorios.", "error");
        return;
      }
      setActionStatus("assetRetireStatus", "Dando de baja...", "info");
      try {
        await retireAsset(assetId, {
          motivo_baja: motivoInput.value.trim(),
          certificado_borrado: certificadoInput.value.trim()
        });
        setActionStatus("assetRetireStatus", "Activo dado de baja.", "success");
        await loadAssetHistory();
      } catch (error) {
        setActionStatus("assetRetireStatus", getErrorMessage(error, "No se pudo dar de baja el activo."), "error");
      }
    });
  }
};

const loadAssetHistory = async () => {
  const assetId = getAssetIdFromQuery();
  if (!assetId) {
    setStatusMessage("No se especificó el activo.", "warning");
    return;
  }
  currentAssetId = assetId;
  setStatusMessage("Cargando hoja de vida...", "info");
  const results = await Promise.allSettled([
    fetchAssetDetail(assetId),
    fetchMaintenances(),
    fetchAssetHistory(assetId),
    fetchAssignments(assetId),
    fetchDocuments(assetId),
    fetchUsers(),
    fetchUbicaciones(),
    fetchSoftwareCatalog(),
    fetchSoftwareByAsset(assetId),
    fetchLicencias()
  ]);
  const asset = results[0].status === "fulfilled" ? results[0].value : null;
  const maintenances = results[1].status === "fulfilled" ? results[1].value : [];
  const history = results[2].status === "fulfilled" ? results[2].value : [];
  const assignments = results[3].status === "fulfilled" ? results[3].value : [];
  const documents = results[4].status === "fulfilled" ? results[4].value : [];
  usersCache = results[5].status === "fulfilled" ? results[5].value : [];
  ubicacionesCache = results[6].status === "fulfilled" ? results[6].value : [];
  softwareCatalogCache = results[7].status === "fulfilled" ? results[7].value : [];
  const softwareAssigned = results[8].status === "fulfilled" ? results[8].value : [];
  const licenses = results[9].status === "fulfilled" ? results[9].value : [];
  if (!asset) {
    setStatusMessage("Activo no encontrado.", "danger");
    return;
  }
  const assetKey = asset.id_activo || asset.id || asset.idActivo || asset.codigo;
  const assetRecords = maintenances.filter((record) => {
    if (!assetKey) return false;
    return String(record.assetId) === String(assetKey);
  });
  renderAssetHistory(asset, assetRecords, history, assignments, documents);
  await hydrateAssetPanels({
    asset,
    assignments,
    documents,
    softwareAssigned,
    licenses
  });
};

const init = async () => {
  Navbar.init();
  const backBtn = document.getElementById("assetHistoryBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => router.navigateTo("/inventory"));
  }
  await loadAssetHistory();
};

const render = async () => {
  const navbarHTML = Navbar.render();
  return `
    ${navbarHTML}
    <div class="container py-4">
      <div class="asset-history-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <p class="text-muted mb-0">Hoja de vida del activo</p>
          <h1 id="assetHistoryTitle">Activo</h1>
          <p class="text-muted" id="assetHistorySubtitle">Detalle completo y consolidado</p>
        </div>
        ${renderButton({
          id: "assetHistoryBackBtn",
          label: "Volver al inventario",
          variant: "outlineDark"
        })}
      </div>

      <div id="assetHistoryStatus" class="alert alert-info d-none" role="status"></div>

      <div class="asset-history-grid">
        <section class="card sigam-section asset-history-card">
          <div class="card-body">
            <h3>Especificaciones y trazabilidad inicial</h3>
            <dl class="asset-history-list">
              <div class="asset-history-row">
                <dt>Ubicación</dt>
                <dd id="assetSpecLocation">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Proveedor</dt>
                <dd id="assetSpecProvider">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Especificaciones eléctricas</dt>
                <dd id="assetSpecElectrical">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Serial / Modelo</dt>
                <dd id="assetSpecSerial">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Tipo / Estado</dt>
                <dd id="assetSpecType">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Estado operativo</dt>
                <dd id="assetSpecStatus">-</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="card sigam-section asset-history-card">
          <div class="card-body">
            <h3>Gestión del ciclo de vida</h3>
            <dl class="asset-history-list">
              <div class="asset-history-row">
                <dt>Fecha de adquisición</dt>
                <dd id="assetLifecycleAcquisition">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Garantía / Vida útil</dt>
                <dd id="assetLifecycleWarranty">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Fecha de obsolescencia</dt>
                <dd id="assetLifecycleObsolescence">-</dd>
              </div>
              <div class="asset-history-row">
                <dt>Uso estimado</dt>
                <dd id="assetLifecycleUsedMonths">-</dd>
              </div>
            </dl>
            <div id="assetObsolescenceAlert" class="asset-history-alert alert alert-info d-none"></div>
          </div>
        </section>
      </div>

      <section class="card sigam-section asset-history-card mt-3">
        <div class="card-body">
          <h3>Historial de custodia y mantenimiento</h3>
          <div id="assetCustodyCurrent" class="asset-history-custody mb-3"></div>
          <div class="asset-history-actions">
            <div class="asset-history-action-card">
              <h4 class="asset-history-subtitle">Asignar usuario responsable</h4>
              <div class="asset-history-inline-form">
                <select id="assetAssignUserSelect" class="form-select"></select>
                <button id="assetAssignUserBtn" class="btn btn-primary">Asignar</button>
              </div>
              <small id="assetAssignUserStatus" class="text-muted"></small>
            </div>
            <div class="asset-history-action-card">
              <h4 class="asset-history-subtitle">Actualizar ubicación</h4>
              <div class="asset-history-inline-form">
                <select id="assetLocationSelect" class="form-select"></select>
                <button id="assetLocationSaveBtn" class="btn btn-outline-primary">Guardar</button>
              </div>
              <small id="assetLocationStatus" class="text-muted"></small>
            </div>
          </div>
          <h4 class="asset-history-subtitle">Asignaciones registradas</h4>
          <div id="assetAssignmentsList" class="asset-history-assignments mb-4"></div>
          <div id="assetMaintenanceTimeline" class="asset-history-timeline"></div>
          <h4 class="asset-history-subtitle mt-4">Eventos del activo</h4>
          <div id="assetHistoryEvents" class="asset-history-events"></div>
        </div>
      </section>

      <section class="card sigam-section asset-history-card mt-3">
        <div class="card-body">
          <h3>Licencias y software</h3>
          <div class="asset-history-actions">
            <div class="asset-history-action-card">
              <h4 class="asset-history-subtitle">Software instalado</h4>
              <div id="assetSoftwareList" class="asset-history-stack mb-3"></div>
              <div class="asset-history-inline-form">
                <select id="assetSoftwareSelect" class="form-select"></select>
                <button id="assetSoftwareAssignBtn" class="btn btn-outline-primary">Asignar</button>
              </div>
              <small id="assetSoftwareStatus" class="text-muted"></small>
            </div>
            <div class="asset-history-action-card">
              <h4 class="asset-history-subtitle">Licencias asociadas</h4>
              <div id="assetLicenseList" class="asset-history-stack mb-3"></div>
              <div class="asset-history-inline-form">
                <select id="assetLicenseSelect" class="form-select"></select>
                <button id="assetLicenseAssignBtn" class="btn btn-outline-primary">Asignar</button>
              </div>
              <small id="assetLicenseStatus" class="text-muted"></small>
            </div>
          </div>
        </div>
      </section>

      <section class="card sigam-section asset-history-card mt-3">
        <div class="card-body">
          <h3>Documentos y certificados</h3>
          <div id="assetDocumentsList" class="asset-history-documents mb-3"></div>
          <form id="assetDocumentForm" class="asset-history-form">
            <div class="asset-history-form-row">
              <div class="asset-history-field">
                <label for="assetDocumentName" class="form-label">Nombre del documento</label>
                <input id="assetDocumentName" class="form-control" type="text" placeholder="Certificado de borrado" />
              </div>
              <div class="asset-history-field">
                <label for="assetDocumentType" class="form-label">Tipo</label>
                <input id="assetDocumentType" class="form-control" type="text" placeholder="ISO 27001" />
              </div>
            </div>
            <div class="asset-history-field">
              <label for="assetDocumentUrl" class="form-label">URL del documento</label>
              <input id="assetDocumentUrl" class="form-control" type="url" placeholder="https://..." />
            </div>
            <div class="asset-history-inline-form mt-2">
              <button type="submit" class="btn btn-primary">Guardar documento</button>
              <small id="assetDocumentStatus" class="text-muted"></small>
            </div>
          </form>
        </div>
      </section>

      <section class="card sigam-section asset-history-card mt-3">
        <div class="card-body">
          <h3>Métricas de confiabilidad (GTC 62)</h3>
          <div class="asset-history-metrics">
            <div class="asset-history-metric">
              <strong id="assetMetricMTTR">-</strong>
              <small>Tiempo medio de reparación (MTTR)</small>
            </div>
            <div class="asset-history-metric">
              <strong id="assetMetricMTBF">-</strong>
              <small>Tiempo medio entre fallas (MTBF)</small>
            </div>
          </div>
        </div>
      </section>

      <section class="card sigam-section asset-history-card mt-3">
        <div class="card-body">
          <h3>Disposición final y seguridad (ISO 27001)</h3>
          <p id="assetDisposalMessage" class="mb-2">No hay registro de baja.</p>
          <div id="assetDisposalCertificate" class="asset-history-certificate">Sin certificado</div>
          <form id="assetRetireForm" class="asset-history-form mt-3">
            <div class="asset-history-form-row">
              <div class="asset-history-field">
                <label for="assetRetireReason" class="form-label">Motivo de baja</label>
                <input id="assetRetireReason" class="form-control" type="text" placeholder="Obsolescencia, daño irreparable..." />
              </div>
              <div class="asset-history-field">
                <label for="assetRetireCertificate" class="form-label">URL certificado de borrado</label>
                <input id="assetRetireCertificate" class="form-control" type="url" placeholder="https://..." />
              </div>
            </div>
            <div class="asset-history-inline-form mt-2">
              <button type="submit" class="btn btn-outline-danger">Dar de baja</button>
              <small id="assetRetireStatus" class="text-muted"></small>
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
};

export const AssetHistoryPage = {
  render,
  init,
  meta: {
    bodyClass: "page-asset-history",
    roles: ROLE_ALLOWLIST
  }
};
