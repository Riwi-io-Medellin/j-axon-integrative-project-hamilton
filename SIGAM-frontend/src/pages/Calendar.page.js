import { Navbar } from "../components/Navbar.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { getUser } from "../state/storage.js";
import { normalizeCollection } from "../utils/normalize.js";
import { renderButton } from "../components/Button.js";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import "../css/pages/calendar.css";

const ROLE_ALLOWLIST = ["Gerente", "Tecnico"];

let calendarInstance = null;
let currentView = "dayGridMonth";

const render = async () => {
  const navbarHTML = Navbar.render();

  return `
    ${navbarHTML}
    <div class="container mt-4">
      <div class="calendar-header">
        <div>
          <h3>Maintenance Calendar</h3>
          <p class="text-muted">
            Scheduling preventive maintenance and inspections
          </p>
        </div>

        ${renderButton({
          label: "+ Schedule Maintenance",
          variant: "dark",
          attrs: { "data-bs-toggle": "modal", "data-bs-target": "#scheduleModal" }
        })}
      </div>

      <div class="row mb-4">
        <div class="col-md-4">
          <div class="stat-card">
            <i class="bi bi-calendar-event"></i>
            <h6 class="text-muted">Scheduled</h6>
            <h3 id="scheduledCount">0</h3>
          </div>
        </div>

        <div class="col-md-4">
          <div class="stat-card">
            <i class="bi bi-exclamation-triangle"></i>
            <h6 class="text-muted text-danger">Overdue</h6>
            <h3 id="overdueCount">0</h3>
          </div>
        </div>

        <div class="col-md-4">
          <div class="stat-card">
            <i class="bi bi-wrench"></i>
            <h6 class="text-muted text-success">Assets in Plan</h6>
            <h3 id="assetsCount">0</h3>
          </div>
        </div>
      </div>

      <div class="calendar-toolbar d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center gap-2">
          ${renderButton({
            id: "prevPeriodBtn",
            content: "&lsaquo;",
            variant: "light"
          })}
          <h5 id="monthLabel" class="mb-0"></h5>
          ${renderButton({
            id: "nextPeriodBtn",
            content: "&rsaquo;",
            variant: "light"
          })}
        </div>

        <div class="d-flex gap-2 align-items-center">
          <input id="eventSearch" class="form-control" placeholder="Search ticket, asset or note" />
          <div class="btn-group" role="group" aria-label="Calendar view">
            ${renderButton({
              id: "viewWeekBtn",
              label: "Week",
              variant: "outlineDark"
            })}
            ${renderButton({
              id: "viewMonthBtn",
              label: "Month",
              variant: "outlineDark"
            })}
            ${renderButton({
              id: "viewListBtn",
              label: "List",
              variant: "outlineDark"
            })}
          </div>
          <select id="typeFilter" class="form-select">
            <option value="all">All Types</option>
            <option value="preventive">Preventive</option>
            <option value="inspection">Inspection</option>
            <option value="repair">Repair</option>
          </select>
          <select id="assetFilter" class="form-select">
            <option value="all">All Assets</option>
          </select>
          <select id="techFilter" class="form-select">
            <option value="all">All Technicians</option>
          </select>
          ${renderButton({
            id: "goTodayBtn",
            label: "Today",
            variant: "light"
          })}
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-9">
          <div id="calendar" class="calendar"></div>
          <div class="calendar-hint">Tip: drag events to reschedule quickly.</div>
        </div>
        <div class="col-lg-3">
          <div class="calendar-panel">
            <h6 class="calendar-panel-title">Upcoming</h6>
            <div id="upcomingList" class="calendar-list"></div>
            <h6 class="calendar-panel-title mt-4">Overdue</h6>
            <div id="overdueList" class="calendar-list"></div>
          </div>
        </div>
      </div>

      <div class="event-legend mt-4">
        <div class="legend-item">
          <span class="legend-dot preventive"></span>
          Preventive
        </div>
        <div class="legend-item">
          <span class="legend-dot inspection"></span>
          Inspection
        </div>
        <div class="legend-item">
          <span class="legend-dot repair"></span>
          Repair
        </div>
      </div>
    </div>

    <div class="modal fade" id="scheduleModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Schedule Maintenance</h5>

            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form id="scheduleForm">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Ticket ID</label>
                <input id="ticketId" class="form-control" placeholder="e.g. 10" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Asset</label>
                <select id="assetName" class="form-select"></select>
              </div>

              <div class="mb-3">
                <label class="form-label">Técnico</label>
                <select id="maintenanceTechnician" class="form-select"></select>
              </div>

              <div class="mb-3">
                <label class="form-label">Maintenance Type</label>
                <select id="maintenanceType" class="form-select">
                  <option value="preventive">Preventive</option>
                  <option value="inspection">Inspection</option>
                  <option value="repair">Repair</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Date</label>
                <input id="maintenanceDate" type="date" class="form-control" />
              </div>

              <div class="mb-3">
                <label class="form-label">Notes</label>
                <textarea id="notes" class="form-control"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              ${renderButton({
                label: "Cancel",
                variant: "secondary",
                attrs: { "data-bs-dismiss": "modal" }
              })}

              <div id="scheduleStatus" class="me-auto small text-muted" aria-live="polite"></div>
              ${renderButton({
                label: "Save Schedule",
                type: "submit",
                variant: "dark"
              })}
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="modal fade" id="detailModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Maintenance Details</h5>

            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <p><strong>Ticket:</strong> <span id="detailTicket"></span></p>
            <p><strong>Asset:</strong> <span id="detailAsset"></span></p>
            <p><strong>Type:</strong> <span id="detailType"></span></p>
            <p><strong>Date:</strong> <span id="detailDate"></span></p>
            <p><strong>Notes:</strong> <span id="detailNotes"></span></p>
          </div>

          <div class="modal-footer">
            ${renderButton({
              id: "deleteMaintenanceBtn",
              label: "Delete",
              variant: "danger"
            })}

            ${renderButton({
              id: "editMaintenanceBtn",
              label: "Edit",
              variant: "primaryBootstrap"
            })}

            ${renderButton({
              label: "Close",
              variant: "secondary",
              attrs: { "data-bs-dismiss": "modal" }
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
  await initCalendar();
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
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
    script.async = true;
    script.setAttribute("data-sigam-bootstrap", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Bootstrap JS failed to load"));
    document.head.appendChild(script);
  });
};

const initCalendar = async () => {
  const state = {
    maintenances: [],
    assetsList: [],
    techniciansList: [],
    usingApi: false,
    editIndex: null
  };
  window.__calendarState = state;

  const scheduleStatus = document.querySelector("#scheduleStatus");
  const scheduleForm = document.querySelector("#scheduleForm");
  const calendarEl = document.querySelector("#calendar");
  const monthLabel = document.querySelector("#monthLabel");

  const scheduledEl = document.querySelector("#scheduledCount");
  const overdueEl = document.querySelector("#overdueCount");
  const assetsEl = document.querySelector("#assetsCount");

  const prevPeriodBtn = document.querySelector("#prevPeriodBtn");
  const nextPeriodBtn = document.querySelector("#nextPeriodBtn");
  const goTodayBtn = document.querySelector("#goTodayBtn");
  const viewWeekBtn = document.querySelector("#viewWeekBtn");
  const viewMonthBtn = document.querySelector("#viewMonthBtn");
  const typeFilter = document.querySelector("#typeFilter");
  const assetFilter = document.querySelector("#assetFilter");
  const techFilter = document.querySelector("#techFilter");
  const eventSearch = document.querySelector("#eventSearch");
  const viewListBtn = document.querySelector("#viewListBtn");

  const upcomingList = document.querySelector("#upcomingList");
  const overdueList = document.querySelector("#overdueList");

  const detailAsset = document.querySelector("#detailAsset");
  const detailTicket = document.querySelector("#detailTicket");
  const detailType = document.querySelector("#detailType");
  const detailDate = document.querySelector("#detailDate");
  const detailNotes = document.querySelector("#detailNotes");

  const deleteBtn = document.querySelector("#deleteMaintenanceBtn");
  const editBtn = document.querySelector("#editMaintenanceBtn");

  const ticketIdInput = document.querySelector("#ticketId");
  const assetSelect = document.querySelector("#assetName");
  const maintenanceTechnicianSelect = document.querySelector("#maintenanceTechnician");
  const typeSelect = document.querySelector("#maintenanceType");
  const dateInput = document.querySelector("#maintenanceDate");
  const notesInput = document.querySelector("#notes");

  if (!calendarEl) {
    if (calendarEl) {
      calendarEl.innerHTML = '<div class="calendar-empty">Calendar could not load. Please refresh.</div>';
    }
    return;
  }

  calendarInstance = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    headerToolbar: false,
    editable: true,
    eventDurationEditable: true,
    eventStartEditable: true,
    nowIndicator: true,
    selectable: true,
    selectMirror: true,
    eventDisplay: "block",
    eventClassNames: (arg) => {
      const type = String(arg.event.extendedProps.type || "").toLowerCase();
      return type ? [`type-${type}`] : [];
    },
    eventContent: (arg) => {
      const asset = getAssetLabel(arg.event.extendedProps.asset) || "Asset";
      const type = arg.event.extendedProps.type || "maintenance";
      const ticket = arg.event.extendedProps.ticketId || "-";
      return {
        html: `<div class="fc-event-title">${asset}</div><div class="fc-event-meta">${type} · #${ticket}</div>`
      };
    },
    eventDidMount: (info) => {
      const asset = getAssetLabel(info.event.extendedProps.asset) || "Asset";
      const type = info.event.extendedProps.type || "maintenance";
      const ticket = info.event.extendedProps.ticketId || "-";
      info.el.setAttribute("title", `${asset} · ${type} · #${ticket}`);
    },
    eventClick: (info) => {
      const maintenance = findMaintenanceByEvent(state.maintenances, info.event);
      if (!maintenance) return;
      openDetailModal(state, maintenance);
    },
    eventDrop: (info) => {
      const maintenance = findMaintenanceByEvent(state.maintenances, info.event);
      if (!maintenance) return;
      maintenance.date = info.event.startStr ? info.event.startStr.slice(0, 10) : maintenance.date;
      persistMaintenances(state);
      syncCalendarEvents(state.maintenances, getFilters());
      updateStats(state, scheduledEl, overdueEl, assetsEl);
      renderSidebarLists(state, upcomingList, overdueList, getFilters());
      if (state.usingApi) {
        updateMaintenanceInApi(maintenance);
      }
    },
    eventResize: (info) => {
      const maintenance = findMaintenanceByEvent(state.maintenances, info.event);
      if (!maintenance) return;
      maintenance.date = info.event.startStr ? info.event.startStr.slice(0, 10) : maintenance.date;
      persistMaintenances(state);
      syncCalendarEvents(state.maintenances, getFilters());
      updateStats(state, scheduledEl, overdueEl, assetsEl);
      renderSidebarLists(state, upcomingList, overdueList, getFilters());
      if (state.usingApi) {
        updateMaintenanceInApi(maintenance);
      }
    },
    select: (info) => {
      if (dateInput) dateInput.value = info.startStr.slice(0, 10);
      const modal = new window.bootstrap.Modal(document.getElementById("scheduleModal"));
      modal.show();
    }
  });

  calendarInstance.render();
  currentView = calendarInstance.view.type;
  updateViewButtons(currentView, viewWeekBtn, viewMonthBtn, viewListBtn);
  updateMonthLabel(monthLabel);

  if (prevPeriodBtn) {
    prevPeriodBtn.addEventListener("click", () => {
      calendarInstance.prev();
      updateMonthLabel(monthLabel);
    });
  }
  if (nextPeriodBtn) {
    nextPeriodBtn.addEventListener("click", () => {
      calendarInstance.next();
      updateMonthLabel(monthLabel);
    });
  }
  if (goTodayBtn) {
    goTodayBtn.addEventListener("click", () => {
      calendarInstance.today();
      updateMonthLabel(monthLabel);
    });
  }
  if (viewWeekBtn) {
    viewWeekBtn.addEventListener("click", () => {
      calendarInstance.changeView("timeGridWeek");
      currentView = "timeGridWeek";
      updateViewButtons(currentView, viewWeekBtn, viewMonthBtn, viewListBtn);
      updateMonthLabel(monthLabel);
    });
  }
  if (viewMonthBtn) {
    viewMonthBtn.addEventListener("click", () => {
      calendarInstance.changeView("dayGridMonth");
      currentView = "dayGridMonth";
      updateViewButtons(currentView, viewWeekBtn, viewMonthBtn, viewListBtn);
      updateMonthLabel(monthLabel);
    });
  }
  if (viewListBtn) {
    viewListBtn.addEventListener("click", () => {
      calendarInstance.changeView("listWeek");
      currentView = "listWeek";
      updateViewButtons(currentView, viewWeekBtn, viewMonthBtn, viewListBtn);
      updateMonthLabel(monthLabel);
    });
  }

  if (scheduleForm) {
    scheduleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ticketId = ticketIdInput ? ticketIdInput.value.trim() : "";
      const selectedAssetId = assetSelect ? assetSelect.value : "";
      const assetOption = state.assetsList.find((a) => String(a.id) === String(selectedAssetId));
      const assetValue = assetOption ? assetOption.label : "";
      const selectedTechnicianId = maintenanceTechnicianSelect ? maintenanceTechnicianSelect.value : "";
      const typeValue = typeSelect ? typeSelect.value : "preventive";
      const dateValue = dateInput ? dateInput.value : "";
      const notesValue = notesInput ? notesInput.value : "";

      if (!ticketId || !dateValue) {
        setScheduleStatus(scheduleStatus, "Ticket ID y Date son obligatorios.", "error");
        return;
      }

      const user = getUser();
      const technicianId = selectedTechnicianId || (user && (user.id || user.id_usuario || user.userId));

      if (!technicianId) {
        setScheduleStatus(scheduleStatus, "Debes iniciar sesion para programar mantenimiento.", "error");
        return;
      }

      const target = state.maintenances[state.editIndex] || {};
      const assetRecord = {
        label: assetValue,
        assetId: assetOption ? String(assetOption.id) : null
      };
      const maintenance = {
        id: target.id || "",
        localId: state.editIndex === null ? buildLocalId() : target.localId,
        ticketId,
        technicianId,
        asset: assetRecord,
        assetId: assetRecord.assetId,
        type: typeValue,
        date: dateValue,
        notes: notesValue
      };

      if (state.editIndex !== null) {
        state.maintenances[state.editIndex] = maintenance;
        state.editIndex = null;
      } else {
        state.maintenances.push(maintenance);
      }

      persistMaintenances(state);
      syncCalendarEvents(state.maintenances, getFilters());
      updateStats(state, scheduledEl, overdueEl, assetsEl);
      renderSidebarLists(state, upcomingList, overdueList, getFilters());

      if (state.usingApi) {
        await upsertMaintenanceInApi(maintenance, scheduleStatus, state);
      }

      scheduleForm.reset();
      const modal = window.bootstrap.Modal.getInstance(document.getElementById("scheduleModal"));
      if (modal) {
        modal.hide();
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Delete this maintenance?")) return;
      const target = state.maintenances[state.editIndex] || {};
      if (state.usingApi && target.id) {
        await deleteMaintenanceInApi(target.id, scheduleStatus);
      }
      state.maintenances.splice(state.editIndex, 1);
      persistMaintenances(state);
      syncCalendarEvents(state.maintenances, getFilters());
      updateStats(state, scheduledEl, overdueEl, assetsEl);
      renderSidebarLists(state, upcomingList, overdueList, getFilters());
      const modal = window.bootstrap.Modal.getInstance(document.getElementById("detailModal"));
      if (modal) modal.hide();
    });
  }

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const target = state.maintenances[state.editIndex];
      if (!target) return;
      openEditModal(state, target);
      const detailModal = window.bootstrap.Modal.getInstance(document.getElementById("detailModal"));
      if (detailModal) detailModal.hide();
    });
  }

  const refreshFilters = () => {
    syncCalendarEvents(state.maintenances, getFilters());
    renderSidebarLists(state, upcomingList, overdueList, getFilters());
  };

  if (typeFilter) {
    typeFilter.addEventListener("change", refreshFilters);
  }

  if (assetFilter) {
    assetFilter.addEventListener("change", refreshFilters);
  }

  if (techFilter) {
    techFilter.addEventListener("change", refreshFilters);
  }

  if (eventSearch) {
    eventSearch.addEventListener("input", refreshFilters);
  }

  bindListHandlers(state, upcomingList, overdueList);
  await refreshMaintenances(state, scheduleStatus, scheduledEl, overdueEl, assetsEl);
  await loadAssets(state, assetSelect);
  await loadTechnicians(state, maintenanceTechnicianSelect);
};

const setScheduleStatus = (element, message, type) => {
  if (!element) return;
  element.textContent = message || "";
  element.className = "me-auto small";
  if (type === "error") {
    element.classList.add("text-danger");
  } else if (type === "success") {
    element.classList.add("text-success");
  } else {
    element.classList.add("text-muted");
  }
};

const getTicketField = (raw, key) => {
  if (!raw) return undefined;
  if (raw.ticket && raw.ticket[key] !== undefined) return raw.ticket[key];
  if (raw.tickets && raw.tickets[key] !== undefined) return raw.tickets[key];
  const alias = raw[`ticket_${key}`];
  if (alias !== undefined) return alias;
  return undefined;
};

const getAssetField = (raw, keys = []) => {
  if (!raw) return undefined;
  const sources = [raw.asset, raw.activo, raw];
  for (const key of keys) {
    for (const source of sources) {
      if (source && source[key] !== undefined) return source[key];
    }
    if (raw[`asset_${key}`] !== undefined) return raw[`asset_${key}`];
  }
  return undefined;
};

const buildAssetMetadata = (raw) => {
  const assetId =
    getTicketField(raw, "id_activo") ||
    raw.id_activo ||
    raw.activo_id ||
    raw.assetId ||
    null;
  const labelParts = [
    raw.asset?.label,
    raw.assetName,
    raw.nombre_activo,
    raw.nombre,
    raw.activo?.nombre,
    getAssetField(raw, ["modelo"]),
    getAssetField(raw, ["serial"]),
    getTicketField(raw, "descripcion"),
    raw.ticket_descripcion
  ]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);
  const label = labelParts.join(" · ") || (assetId ? `Activo ${assetId}` : "Activo sin nombre");
  return {
    assetId: assetId ? String(assetId) : null,
    label,
    serial:
      getAssetField(raw, ["serial"]) || raw.serial || raw.asset_serial || "",
    modelo:
      getAssetField(raw, ["modelo"]) || raw.modelo || raw.asset_modelo || "",
    estado:
      getAssetField(raw, ["estado_activo", "estado"]) || raw.asset_estado_activo || raw.estado || "",
    criticidad:
      getAssetField(raw, ["nivel_criticidad", "criticidad"]) || raw.asset_nivel_criticidad || raw.criticidad || ""
  };
};

const normalizeMaintenance = (raw) => {
  const ticketId = raw.id_ticket || raw.ticketId || getTicketField(raw, "id_ticket") || "";
  const dateValue = raw.fecha_inicio || raw.date || "";
  const assetMetadata = buildAssetMetadata(raw);
  const fallbackKey = [ticketId, dateValue, assetMetadata.label].filter(Boolean).join("|");
  const idOrden = raw.id_orden || raw.id || raw.id_mantenimiento || raw.id_mantenimiento_orden || "";

  return {
    id: idOrden,
    localId: raw.localId || (idOrden ? idOrden : `local-${fallbackKey || buildLocalId()}`),
    ticketId,
    technicianId: raw.id_usuario_tecnico || raw.technicianId || "",
    asset: assetMetadata,
    assetId: assetMetadata.assetId,
    type: raw.tipo || raw.type || getTicketField(raw, "tipo_ticket") || "preventive",
    date: dateValue,
    notes:
      raw.diagnostico || raw.notes || getTicketField(raw, "descripcion") || ""
  };
};

const buildLocalId = () => `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const refreshMaintenances = async (state, scheduleStatus, scheduledEl, overdueEl, assetsEl) => {
  if (SIGAM_CONFIG.API_BASE_URL) {
    try {
      const payload = await api.apiRequest(SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT);
      const data = normalizeCollection(payload);
      state.usingApi = true;
      const previous = state.maintenances || [];
      state.maintenances = (data || []).map((item) => mergeMaintenanceItem(normalizeMaintenance(item), previous));
      persistMaintenances(state);
      syncCalendarEvents(state.maintenances, getFilters());
      setScheduleStatus(scheduleStatus, "Maintenance loaded from the API.", "success");
      updateStats(state, scheduledEl, overdueEl, assetsEl);
      renderSidebarLists(state, document.querySelector("#upcomingList"), document.querySelector("#overdueList"), getFilters());
      updateFilterOptions(state);
      return;
    } catch (error) {
      setScheduleStatus(scheduleStatus, "Could not load maintenance from the API.", "error");
    }
  }

  state.usingApi = false;
  const cached = JSON.parse(localStorage.getItem("maintenances") || "[]");
  state.maintenances = cached.map((item) => normalizeMaintenance(item));
  syncCalendarEvents(state.maintenances, getFilters());
  updateStats(state, scheduledEl, overdueEl, assetsEl);
  renderSidebarLists(state, document.querySelector("#upcomingList"), document.querySelector("#overdueList"), getFilters());
  updateFilterOptions(state);
};

const persistMaintenances = (state) => {
  localStorage.setItem("maintenances", JSON.stringify(state.maintenances));
};

const syncCalendarEvents = (maintenances, filters) => {
  if (!calendarInstance) return;
  const filtered = applyAllFilters(maintenances, filters);
  const events = filtered.map((m) => ({
    id: m.id || m.localId || buildLocalId(),
    title: `${getAssetLabel(m.asset)} · ${m.type || "maintenance"} · #${m.ticketId || "-"}`,
    start: m.date ? `${m.date}T00:00:00` : new Date(),
    end: m.date ? `${m.date}T23:59:59` : new Date(),
    allDay: true,
    backgroundColor: getTypeColor(m.type),
    borderColor: getTypeColor(m.type),
    textColor: "#ffffff",
    extendedProps: {
      maintenanceId: m.id,
      localId: m.localId,
      ticketId: m.ticketId,
      technicianId: m.technicianId,
      asset: m.asset,
      type: m.type,
      date: m.date,
      notes: m.notes
    }
  }));
  calendarInstance.removeAllEvents();
  calendarInstance.addEventSource(events);
};

const getTypeFilterValue = () => {
  const el = document.querySelector("#typeFilter");
  return el ? el.value : "all";
};

const getAssetFilterValue = () => {
  const el = document.querySelector("#assetFilter");
  return el ? el.value : "all";
};

const getTechFilterValue = () => {
  const el = document.querySelector("#techFilter");
  return el ? el.value : "all";
};

const getSearchValue = () => {
  const el = document.querySelector("#eventSearch");
  return el ? el.value.trim().toLowerCase() : "";
};

const getFilters = () => ({
  type: getTypeFilterValue(),
  asset: getAssetFilterValue(),
  tech: getTechFilterValue(),
  search: getSearchValue()
});

const applyTypeFilter = (maintenances, filter) => {
  if (!filter || filter === "all") return maintenances;
  return maintenances.filter((m) => String(m.type || "").toLowerCase() === filter);
};

const applyAssetFilter = (maintenances, filter) => {
  if (!filter || filter === "all") return maintenances;
  return maintenances.filter((m) => String(m.assetId || getAssetLabel(m.asset) || "") === filter);
};

const getAssetLabel = (asset) => {
  if (!asset) return "";
  if (typeof asset === "string") return asset;
  return asset.label || asset.nombre || "";
};

const applyTechFilter = (maintenances, filter) => {
  if (!filter || filter === "all") return maintenances;
  return maintenances.filter((m) => String(m.technicianId || "") === filter);
};

const getTypeColor = (type) => {
  const key = String(type || "").toLowerCase();
  if (key === "inspection") return "#16a34a";
  if (key === "repair") return "#dc2626";
  return "#2563eb";
};

const applyTextFilter = (maintenances, search) => {
  if (!search) return maintenances;
  return maintenances.filter((m) => {
    const haystack = [
      m.asset,
      m.type,
      m.notes,
      m.ticketId,
      m.technicianId
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
};

const applyAllFilters = (maintenances, filters) => {
  const safe = filters || {};
  return applyTextFilter(
    applyTechFilter(
      applyAssetFilter(
        applyTypeFilter(maintenances, safe.type),
        safe.asset
      ),
      safe.tech
    ),
    safe.search
  );
};

const renderSidebarLists = (state, upcomingEl, overdueEl, filters) => {
  if (!upcomingEl || !overdueEl) return;
  const today = new Date().toISOString().split("T")[0];
  const filtered = applyAllFilters(state.maintenances, filters);
  const upcoming = filtered
    .filter((m) => m.date && m.date >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 6);
  const overdue = filtered
    .filter((m) => m.date && m.date < today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 6);

  const renderItem = (item) => {
    const index = state.maintenances.findIndex(
      (m) =>
        (item.id && String(m.id) === String(item.id)) ||
        (item.localId && String(m.localId) === String(item.localId)) ||
        (m.ticketId === item.ticketId && m.date === item.date && m.asset === item.asset)
    );
    return `
    <div class="calendar-list-item type-${item.type || "preventive"}" data-index="${index}">
    <div class="calendar-list-title">${getAssetLabel(item.asset) || "Asset"}</div>
      <div class="calendar-list-meta">${item.date || "No date"} · ${item.type || "maintenance"} · #${item.ticketId || "-"}</div>
      <div class="calendar-list-actions">
        <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit">Edit</button>
      </div>
    </div>
  `;
  };

  upcomingEl.innerHTML = upcoming.length
    ? upcoming.map(renderItem).join("")
    : '<div class="calendar-empty">No upcoming items. Aquí aparecerán los mantenimientos futuros.</div>';
  overdueEl.innerHTML = overdue.length
    ? overdue.map(renderItem).join("")
    : '<div class="calendar-empty">No overdue items. Aquí verás mantenimientos vencidos.</div>';
};

const updateFilterOptions = (state) => {
  const assetFilter = document.querySelector("#assetFilter");
  const techFilter = document.querySelector("#techFilter");
  if (!assetFilter && !techFilter) return;

  if (assetFilter) {
    const current = assetFilter.value || "all";
    const assetOptions = state.assetsList
      .filter((asset) => asset && asset.id && asset.label)
      .map((asset) => ({ id: asset.id, label: asset.label }));
    assetFilter.innerHTML = '<option value="all">All Assets</option>';
    assetOptions.forEach(({ id, label }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = label;
      assetFilter.appendChild(option);
    });
    assetFilter.value = assetOptions.some((entry) => entry.id === current) ? current : "all";
  }

  if (techFilter) {
    const current = techFilter.value || "all";
    const techOptions = state.techniciansList
      .filter((tech) => tech && tech.id && tech.label)
      .map((tech) => ({ id: tech.id, label: tech.label }));
    techFilter.innerHTML = '<option value="all">All Technicians</option>';
    techOptions.forEach(({ id, label }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = label;
      techFilter.appendChild(option);
    });
    techFilter.value = techOptions.some((entry) => entry.id === current) ? current : "all";
  }
};

const mergeAssetFields = (primary = {}, fallback = {}, fallbackId = null) => {
  const assetId = primary.assetId || fallback.assetId || fallbackId || null;
  return {
    assetId: assetId ? String(assetId) : null,
    label: primary.label || fallback.label || "",
    serial: primary.serial || fallback.serial || "",
    modelo: primary.modelo || fallback.modelo || "",
    estado: primary.estado || fallback.estado || "",
    criticidad: primary.criticidad || fallback.criticidad || ""
  };
};

const mergeMaintenanceItem = (item, previousList = []) => {
  const matches = previousList.find((candidate) => {
    if (item.id && candidate.id) {
      return String(candidate.id) === String(item.id);
    }
    if (item.localId && candidate.localId) {
      return String(candidate.localId) === String(item.localId);
    }
    if (candidate.ticketId && item.ticketId && candidate.date && item.date) {
      return candidate.ticketId === item.ticketId && candidate.date === item.date;
    }
    return false;
  });
  if (!matches) return item;
  const mergedAsset = mergeAssetFields(item.asset, matches.asset, item.assetId || matches.assetId);
  return {
    ...item,
    asset: mergedAsset,
    assetId: mergedAsset.assetId
  };
};

const openEditModal = (state, maintenance) => {
  const ticketIdInput = document.querySelector("#ticketId");
  const assetSelect = document.querySelector("#assetName");
  const maintenanceTechnicianSelect = document.querySelector("#maintenanceTechnician");
  const typeSelect = document.querySelector("#maintenanceType");
  const dateInput = document.querySelector("#maintenanceDate");
  const notesInput = document.querySelector("#notes");
  if (state) {
    state.editIndex = state.maintenances.indexOf(maintenance);
  }
  if (ticketIdInput) ticketIdInput.value = maintenance.ticketId || "";
  if (assetSelect) assetSelect.value = maintenance.assetId || assetSelect.value;
  if (typeSelect) typeSelect.value = maintenance.type || "preventive";
  if (dateInput) dateInput.value = maintenance.date || "";
  if (notesInput) notesInput.value = maintenance.notes || "";
  if (maintenanceTechnicianSelect) {
    const techValue = maintenance.technicianId || maintenanceTechnicianSelect.value;
    maintenanceTechnicianSelect.value = techValue;
  }
  const modal = new window.bootstrap.Modal(document.getElementById("scheduleModal"));
  modal.show();
};

const bindListHandlers = (state, upcomingEl, overdueEl) => {
  const handler = (event) => {
    const item = event.target.closest(".calendar-list-item");
    if (!item) return;
    const action = event.target.getAttribute("data-action");
    const index = Number(item.dataset.index);
    const maintenance = Number.isFinite(index) && state.maintenances[index] ? state.maintenances[index] : null;
    if (!maintenance) return;
    if (action === "edit") {
      openEditModal(state, maintenance);
      return;
    }
    openDetailModal(state, maintenance);
  };

  if (upcomingEl) upcomingEl.addEventListener("click", handler);
  if (overdueEl) overdueEl.addEventListener("click", handler);
};

const openDetailModal = (state, maintenance) => {
  const detailAsset = document.querySelector("#detailAsset");
  const detailTicket = document.querySelector("#detailTicket");
  const detailType = document.querySelector("#detailType");
  const detailDate = document.querySelector("#detailDate");
  const detailNotes = document.querySelector("#detailNotes");
  state.editIndex = state.maintenances.indexOf(maintenance);
  if (detailTicket) detailTicket.textContent = maintenance.ticketId || "-";
  if (detailAsset) detailAsset.textContent = getAssetLabel(maintenance.asset) || "";
  if (detailType) detailType.textContent = maintenance.type || "";
  if (detailDate) detailDate.textContent = maintenance.date || "";
  if (detailNotes) detailNotes.textContent = maintenance.notes || "-";
  const modal = new window.bootstrap.Modal(document.getElementById("detailModal"));
  modal.show();
};


const findMaintenanceByEvent = (maintenances, event) => {
  const custom = event && event.extendedProps ? event.extendedProps : {};
  const id = custom.maintenanceId || event.id;
  const localId = custom.localId;
  return maintenances.find(
    (m) => (id && String(m.id) === String(id)) || (localId && String(m.localId) === String(localId))
  );
};

const updateStats = (state, scheduledEl, overdueEl, assetsEl) => {
  if (!scheduledEl && !overdueEl && !assetsEl) {
    return;
  }
  const today = new Date().toISOString().split("T")[0];
  if (scheduledEl) scheduledEl.innerText = state.maintenances.length;
  const overdue = state.maintenances.filter((m) => m.date && m.date < today).length;
  if (overdueEl) overdueEl.innerText = overdue;
  const uniqueAssets = new Set(state.maintenances.map((m) => m.asset));
  if (assetsEl) assetsEl.innerText = uniqueAssets.size;
};

const removeDiacritics = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");

const toAssetEntry = (asset) => {
  const id = asset.id_activo || asset.id || asset.idActivo || asset.name || "";
  const labelParts = [asset.modelo, asset.serial, asset.sede, asset.sala].filter(Boolean);
  const label = labelParts.join(" - ") || asset.nombre || asset.name || `Asset ${id}`;
  return { id, label };
};

const loadAssets = async (state, select) => {
  if (!select) return;
  select.innerHTML = "";

  const renderOptions = (list) => {
    if (!list.length) {
      select.innerHTML = '<option value="">No assets available</option>';
      return;
    }
    list.forEach((asset) => {
      select.innerHTML += `
        <option value="${asset.id}">
          ${asset.label}
        </option>
      `;
    });
  };

  if (SIGAM_CONFIG.API_BASE_URL) {
    try {
      const payload = await api.apiRequest(SIGAM_CONFIG.ACTIVOS_ENDPOINT);
      const data = normalizeCollection(payload);
      state.assetsList = Array.isArray(data) ? data.map(toAssetEntry) : [];
      renderOptions(state.assetsList);
      return;
    } catch {
      select.innerHTML = '<option value="">No assets available</option>';
      return;
    }
  }

  const assets = JSON.parse(localStorage.getItem("assets") || "[]");
  if (assets.length === 0) {
    select.innerHTML = '<option value="">No assets available</option>';
    return;
  }
  state.assetsList = assets.map(toAssetEntry);
  renderOptions(state.assetsList);
};

const upsertMaintenanceInApi = async (maintenance, scheduleStatus, state) => {
  const payload = {
    id_ticket: Number(maintenance.ticketId) || maintenance.ticketId,
    id_usuario_tecnico: maintenance.technicianId,
    diagnostico: maintenance.notes,
    fecha_inicio: maintenance.date,
    id_activo: maintenance.assetId || undefined
  };

  try {
    if (maintenance.id) {
      const safeId = encodeURIComponent(maintenance.id);
      await api.apiRequest(`${SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT}/${safeId}`, {
        method: "PUT",
        body: payload
      });
    } else {
      const response = await api.apiRequest(SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT, {
        method: "POST",
        body: payload
      });
      if (response && response.id) {
        maintenance.id = response.id;
        persistMaintenances(state);
      }
    }
    setScheduleStatus(scheduleStatus, "Maintenance saved in the API.", "success");
    await refreshMaintenances(state, scheduleStatus);
  } catch (error) {
    console.error("Saving maintenance failed", error);
    setScheduleStatus(
      scheduleStatus,
      error?.message ? `No se pudo guardar: ${error.message}` : "Could not save maintenance in the API.",
      "error"
    );
  }
};

const loadTechnicians = async (state, select) => {
  if (!select) return;
  select.innerHTML = "";

  const renderOptions = (list) => {
    if (!list.length) {
      select.innerHTML = '<option value="">No technicians available</option>';
      return;
    }
    list.forEach((tech) => {
      select.innerHTML += `
        <option value="${tech.id}">
          ${tech.label}
        </option>
      `;
    });
  };

  if (SIGAM_CONFIG.API_BASE_URL) {
    try {
      const payload = await api.apiRequest(SIGAM_CONFIG.USUARIOS_ENDPOINT);
      const data = normalizeCollection(payload);
      state.techniciansList = Array.isArray(data)
        ? data
            .filter((user) => {
              const role = removeDiacritics(user.rol || user.role || "").toLowerCase();
              return role.includes("tecnico");
            })
            .map((user) => ({
              id: user.id_usuario || user.id || "",
              label: user.nombre || user.name || `Tecnico ${user.id || user.id_usuario}`
            }))
        : [];
      renderOptions(state.techniciansList);
      return;
    } catch {
      select.innerHTML = '<option value="">No technicians available</option>';
      return;
    }
  }

  select.innerHTML = '<option value="">No technicians available</option>';
};

const updateMaintenanceInApi = async (maintenance) => {
  if (!maintenance.id) return;
  const payload = {
    id_ticket: Number(maintenance.ticketId) || maintenance.ticketId,
    id_usuario_tecnico: maintenance.technicianId,
    diagnostico: maintenance.notes,
    fecha_inicio: maintenance.date,
    id_activo: maintenance.assetId || undefined
  };
  const safeId = encodeURIComponent(maintenance.id);
  try {
    await api.apiRequest(`${SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT}/${safeId}`, {
      method: "PUT",
      body: payload
    });
  } catch (error) {
    console.error("Update maintenance failed", error);
  }
};

const deleteMaintenanceInApi = async (maintenanceId, scheduleStatus) => {
  try {
    const safeId = encodeURIComponent(maintenanceId);
    await api.apiRequest(`${SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT}/${safeId}`, { method: "DELETE" });
    setScheduleStatus(scheduleStatus, "Maintenance deleted in the API.", "success");
  } catch {
    setScheduleStatus(scheduleStatus, "Could not delete in the API.", "error");
  }
};

const updateViewButtons = (viewName, weekBtn, monthBtn, listBtn) => {
  const isWeek = String(viewName).includes("timeGridWeek");
  const isMonth = String(viewName).includes("dayGridMonth");
  const isList = String(viewName).includes("list");
  if (weekBtn) weekBtn.classList.toggle("active", isWeek);
  if (monthBtn) monthBtn.classList.toggle("active", isMonth);
  if (listBtn) listBtn.classList.toggle("active", isList);
};

const updateMonthLabel = (labelEl) => {
  if (!labelEl || !calendarInstance) return;
  const current = calendarInstance.getDate();
  const monthName = current.toLocaleString("default", { month: "long" });
  labelEl.textContent = `${monthName} ${current.getFullYear()}`;
};

export const CalendarPage = {
  render,
  init,
  meta: {
    bodyClass: "page-calendar",
    roles: ROLE_ALLOWLIST
  }
};
