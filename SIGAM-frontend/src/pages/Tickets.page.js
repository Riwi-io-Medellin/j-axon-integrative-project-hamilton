import { Navbar } from "../components/Navbar.js";
import { renderTicketCardBody } from "../components/TicketCard.js";
import { renderButton } from "../components/Button.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { getUser } from "../state/storage.js";
import { router } from "../router.js";
import { normalizeCollection } from "../utils/normalize.js";
import "../css/pages/tickets.css";

const ROLE_ALLOWLIST = ["Gerente", "Analista", "Tecnico", "Usuario"];

const normalizeToken = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const mapStatusClass = (status) => {
  const key = normalizeToken(status);
  if (key.includes("abierto")) return "status-abierto";
  if (key.includes("proceso")) return "status-en-proceso";
  if (key.includes("cerrado")) return "status-cerrado";
  if (key.includes("resuelto")) return "status-resuelto";
  return "";
};

const render = async () => {
  const navbarHTML = Navbar.render();

  return `
    ${navbarHTML}
    <div class="container">
      <div class="header">
        <div>
          <h1>Support tickets</h1>
          <p class="subtitle">Management of incidents and technical requests</p>
        </div>
        ${renderButton({
          id: "newTicketBtn",
          label: "+ New Ticket",
          variant: "primary"
        })}
      </div>

      <div class="filters sigam-section">
        <input id="searchInput" type="text" placeholder="Search tickets..." class="search">
        <select id="statusFilter">
          <option value="all">All the states</option>
          <option value="abierto">Abierto</option>
          <option value="en proceso">En Proceso</option>
          <option value="cerrado">Cerrado</option>
        </select>
        <select id="categoryFilter">
          <option value="all">All categories</option>
        </select>
      </div>

      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <p id="contadorTickets" class="contador mb-0"></p>
        <div class="btn-group btn-group-sm" role="group" aria-label="Ticket view toggle">
          ${renderButton({
            id: "ticketViewGrid",
            label: "Grid",
            variant: "outlineDark",
            className: "btn-sm active",
            attrs: { type: "button" }
          })}
          ${renderButton({
            id: "ticketViewList",
            label: "List",
            variant: "outlineDark",
            className: "btn-sm",
            attrs: { type: "button" }
          })}
        </div>
        <div class="ticket-pagination">
          ${renderButton({
            id: "ticketPrevBtn",
            label: "Prev",
            variant: "primarySmall",
            attrs: { type: "button" }
          })}
          ${renderButton({
            id: "ticketNextBtn",
            label: "Next",
            variant: "primarySmall",
            attrs: { type: "button" }
          })}
          <span id="ticketPageInfo" class="ticket-page-info"></span>
        </div>
      </div>

      <p id="ticketListStatus" class="contador"></p>

      <div id="ticketModal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Create New Ticket</h2>
          <form id="ticketForm" novalidate>
            <input id="title" placeholder="Ticket Title" required>
            <div class="field-error" id="titleError"></div>
            <textarea id="description" placeholder="Description" required></textarea>
            <div class="field-error" id="descriptionError"></div>
            <input id="device" list="deviceList" placeholder="Serial del activo" required>
            <datalist id="deviceList"></datalist>
            <div class="field-error" id="deviceError"></div>
            <select id="category" required>
              <option value="">Selecciona categoria</option>
            </select>
            <div class="field-error" id="categoryError"></div>
            <input id="createdBy" placeholder="Created By" required readonly>
            <div class="field-error" id="createdByError"></div>
            <input id="assignedTo" placeholder="Assigned To">
            <div class="field-error" id="assignedToError"></div>
            <input id="estimate" placeholder="Estimated Time (e.g., 2h)">
            <div class="field-error" id="estimateError"></div>
            <select id="status" required>
              <option value="">Select status</option>
              <option value="Abierto">Abierto</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Cerrado">Cerrado</option>
            </select>
            <div class="field-error" id="statusError"></div>
            <div class="ticket-status" id="ticketStatus" aria-live="polite"></div>
            ${renderButton({
              id: "addTicket",
              label: "Add Ticket",
              type: "submit",
              variant: "primary"
            })}
          </form>
        </div>
      </div>

      <div id="ticketGrid"></div>
      <div class="sigam-section d-none" id="ticketListView">
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Title</th>
                <th>Device</th>
                <th>Category</th>
                <th>Assigned</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="ticketListBody"></tbody>
          </table>
        </div>
      </div>

      <div class="pagination sigam-section" id="ticketPagination">
        ${renderButton({
          id: "prevPage",
          label: "Prev",
          variant: "page"
        })}
        <span id="pageInfo" class="page-info">Page 1</span>
        ${renderButton({
          id: "nextPage",
          label: "Next",
          variant: "page"
        })}
        <select id="pageSize" class="page-size">
          <option value="10">10</option>
          <option value="20" selected>20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  `;
};

const init = async () => {
  Navbar.init();
  initTickets();
};

const initTickets = () => {
  const ticketsState = {
    tickets: [],
    activosMap: new Map(),
    activosBySerial: new Map(),
    activosList: [],
    categoriasMap: new Map(),
    categoriasList: [],
    categoriasAvailable: false,
    currentPage: 1,
    hasMore: false,
    pageSize: 20,
    TICKETS_PAGE_SIZE: 50,
    ticketOffset: 0,
    viewMode: "grid"
  };

  const modal = document.querySelector("#ticketModal");
  const openBtn = document.querySelector("#newTicketBtn");
  const closeBtn = document.querySelector(".close");

  const ticketForm = document.querySelector("#ticketForm");
  const addTicketBtn = document.querySelector("#addTicket");
  const ticketGrid = document.querySelector("#ticketGrid");
  const ticketListView = document.querySelector("#ticketListView");
  const ticketListBody = document.querySelector("#ticketListBody");
  const ticketListStatus = document.querySelector("#ticketListStatus");
  const ticketPrevBtn = document.querySelector("#ticketPrevBtn");
  const ticketNextBtn = document.querySelector("#ticketNextBtn");
  const ticketPageInfo = document.querySelector("#ticketPageInfo");
  const ticketViewGridBtn = document.querySelector("#ticketViewGrid");
  const ticketViewListBtn = document.querySelector("#ticketViewList");

  const searchInput = document.querySelector("#searchInput");
  const ticketStatusEl = document.querySelector("#ticketStatus");
  const ticketsCount = document.querySelector("#contadorTickets");

  const prevPageBtn = document.querySelector("#prevPage");
  const nextPageBtn = document.querySelector("#nextPage");
  const pageInfo = document.querySelector("#pageInfo");
  const pageSizeSelect = document.querySelector("#pageSize");

  const statusFilter = document.querySelector("#statusFilter");
  const categoryFilter = document.querySelector("#categoryFilter");

  const titleInput = document.querySelector("#title");
  const descriptionInput = document.querySelector("#description");
  const deviceInput = document.querySelector("#device");
  const deviceList = document.querySelector("#deviceList");
  const categoryInput = document.querySelector("#category");
  const createdByInput = document.querySelector("#createdBy");
  const assignedToInput = document.querySelector("#assignedTo");
  const estimateInput = document.querySelector("#estimate");
  const statusInput = document.querySelector("#status");

  if (pageSizeSelect) {
    ticketsState.pageSize = Number(pageSizeSelect.value) || ticketsState.pageSize;
  }


  const setStatus = (element, message, type) => {
    if (!element) return;
    element.textContent = message || "";
    element.className = element.className
      .split(" ")
      .filter((cls) => !cls.startsWith("text-"))
      .join(" ");
    if (type === "error") {
      element.classList.add("text-danger");
    }
    if (type === "success") {
      element.classList.add("text-success");
    }
    if (type === "loading") {
      element.classList.add("text-muted");
    }
  };

  const setSubmitting = (button, isSubmitting, label) => {
    if (!button) return;
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? "Loading..." : label;
  };

  const setListStatus = (message, type) => {
    setStatus(ticketListStatus, message, type);
  };

  const setTicketStatus = (message, type) => {
    setStatus(ticketStatusEl, message, type);
  };

  const getCurrentUser = () => {
    return getUser();
  };

  const setCreatedByFromSession = () => {
    const user = getCurrentUser();
    if (!createdByInput) return;
    if (user && (user.nombre || user.name || user.email)) {
      createdByInput.value = user.nombre || user.name || user.email;
      return;
    }
    createdByInput.value = "User";
  };

  const setFieldError = (input, message) => {
    if (!input) return;
    const errorEl = document.querySelector(`#${input.id}Error`);
    if (message) {
      input.classList.add("input-error");
      if (errorEl) errorEl.textContent = message;
    } else {
      input.classList.remove("input-error");
      if (errorEl) errorEl.textContent = "";
    }
  };

  const clearFormErrors = () => {
    setFieldError(titleInput, "");
    setFieldError(descriptionInput, "");
    setFieldError(deviceInput, "");
    setFieldError(categoryInput, "");
    setFieldError(createdByInput, "");
    setFieldError(assignedToInput, "");
    setFieldError(estimateInput, "");
    setFieldError(statusInput, "");
  };

  const validateTicketForm = () => {
    let isValid = true;

    if (!titleInput.value.trim()) {
      isValid = false;
      setFieldError(titleInput, "Title is required.");
    } else {
      setFieldError(titleInput, "");
    }

    if (!descriptionInput.value.trim()) {
      isValid = false;
      setFieldError(descriptionInput, "Description is required.");
    } else {
      setFieldError(descriptionInput, "");
    }

    if (!deviceInput.value.trim()) {
      isValid = false;
      setFieldError(deviceInput, "Device is required.");
    } else {
      setFieldError(deviceInput, "");
    }

    if (ticketsState.categoriasAvailable && !categoryInput.value) {
      isValid = false;
      setFieldError(categoryInput, "Category is required.");
    } else {
      setFieldError(categoryInput, "");
    }

    if (!createdByInput.value.trim()) {
      isValid = false;
      setFieldError(createdByInput, "Created by is required.");
    } else {
      setFieldError(createdByInput, "");
    }

    if (!statusInput.value) {
      isValid = false;
      setFieldError(statusInput, "Status is required.");
    } else {
      setFieldError(statusInput, "");
    }

    setFieldError(assignedToInput, "");
    setFieldError(estimateInput, "");

    return isValid;
  };

  const normalizeTicket = (raw) => {
    const createdAt = raw.createdAt || raw.date || raw.created_at || raw.created_on || raw.fecha_creacion;
    const idActivo = raw.id_activo || raw.activoId || raw.assetId;
    const activoInfo = ticketsState.activosMap.get(String(idActivo)) || {};
    const rawStatus = raw.status || raw.estado || "";
    const normalizedStatus = normalizeToken(rawStatus);
    const categoryId = raw.id_categoria_ticket || raw.id_categoria || raw.categoria_id || raw.categoriaId;
    const categoryLabel =
      raw.categoria_ticket ||
      raw.category ||
      raw.categoria ||
      raw.categoria_nombre ||
      (categoryId ? ticketsState.categoriasMap.get(String(categoryId)) : "") ||
      (activoInfo.raw && (activoInfo.raw.categoria || activoInfo.raw.categoria_nombre)) ||
      "";
    const classificationLabel =
      raw.clasificacion_nlp ||
      raw.classification ||
      raw.clasificacion ||
      raw.clasificacion_ia ||
      "";

    return {
      id: raw.id || raw._id || raw.ticketId || raw.codigo || raw.id_ticket,
      title: raw.title || raw.titulo || raw.asunto || raw.descripcion || "",
      description: raw.description || raw.descripcion || "",
      device: raw.device || raw.dispositivo || raw.activo_serial || activoInfo.label || "",
      category: categoryLabel,
      classification: classificationLabel,
      createdBy: raw.createdBy || raw.creadoPor || raw.created_by || raw.usuario_reporta || "",
      assignedTo: raw.assignedTo || raw.asignadoA || raw.assigned_to || raw.usuario_asignado || raw.tecnico_asignado || "",
      estimate: raw.estimate || raw.tiempoEstimado || raw.estimated || "",
      status: rawStatus,
      statusNormalized: normalizedStatus,
      assetId: idActivo || "",
      date: createdAt ? new Date(createdAt).toLocaleDateString() : ""
    };
  };

  const getActivoSerial = (activo) => {
    return (
      activo.serial ||
      activo.serie ||
      activo.codigo ||
      activo.codigo_activo ||
      activo.serial_activo ||
      ""
    );
  };

  const getActivos = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query ? `${SIGAM_CONFIG.ACTIVOS_ENDPOINT}?${query}` : SIGAM_CONFIG.ACTIVOS_ENDPOINT;
    const payload = await api.apiRequest(path);
    return normalizeCollection(payload);
  };

  const getTickets = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query ? `${SIGAM_CONFIG.TICKETS_ENDPOINT}?${query}` : SIGAM_CONFIG.TICKETS_ENDPOINT;
    const payload = await api.apiRequest(path);
    return normalizeCollection(payload);
  };

  const createTicket = async (body) => {
    return api.apiRequest(SIGAM_CONFIG.TICKETS_ENDPOINT, { method: "POST", body });
  };

  const getCategorias = async () => {
    const endpoint = SIGAM_CONFIG.CATEGORIAS_TICKET_ENDPOINT || "/api/tickets/categorias";
    const payload = await api.apiRequest(endpoint);
    return normalizeCollection(payload);
  };

  const loadActivos = async () => {
    if (!SIGAM_CONFIG.API_BASE_URL) return;
    try {
      const data = await getActivos({ limit: 500, offset: 0 });
      ticketsState.activosList = Array.isArray(data) ? data : [];
      ticketsState.activosMap = new Map(
        ticketsState.activosList.map((activo) => {
          const id = activo.id_activo || activo.id || activo.idActivo;
          const labelParts = [
            activo.modelo,
            getActivoSerial(activo),
            activo.sede,
            activo.sala
          ].filter(Boolean);
          const label = labelParts.join(" - ");
          return [String(id), { label, raw: activo }];
        })
      );
      ticketsState.activosBySerial = new Map(
        ticketsState.activosList
          .map((activo) => ({
            serial: getActivoSerial(activo),
            activo
          }))
          .filter((item) => item.serial)
          .map((item) => [String(item.serial).trim().toLowerCase(), item.activo])
      );

      if (deviceList) {
        const serials = Array.from(new Set(
          ticketsState.activosList
            .map((activo) => getActivoSerial(activo))
            .filter(Boolean)
            .map((serial) => String(serial).trim())
        ));
        deviceList.innerHTML = serials
          .map((serial) => `<option value="${serial}"></option>`)
          .join("");
      }
    } catch (error) {
      setTicketStatus("Unable to load assets from API.", "error");
    }
  };

  const normalizeCategorias = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.categorias)) return data.categorias;
    if (data && Array.isArray(data.categories)) return data.categories;
    return [];
  };

  const getCategoriaLabel = (categoria) => {
    return (
      categoria.nombre ||
      categoria.name ||
      categoria.categoria ||
      categoria.nombre_categoria ||
      ""
    );
  };

  const renderCategorias = () => {
    if (!categoryInput) return;
    ticketsState.categoriasMap = new Map(
      ticketsState.categoriasList.map((categoria) => {
        const id = categoria.id_categoria_ticket || categoria.id_categoria || categoria.id || categoria.idCategoria || getCategoriaLabel(categoria);
        const label = getCategoriaLabel(categoria) || String(id || "Categoria");
        return [String(id), label];
      })
    );

    const placeholder = '<option value="">Selecciona categoria</option>';
    const options = Array.from(ticketsState.categoriasMap.entries())
      .map(([id, label]) => `<option value="${id}">${label}</option>`)
      .join("");
    categoryInput.innerHTML = placeholder + options;
    categoryInput.disabled = false;
    ticketsState.categoriasAvailable = options.length > 0;

    if (categoryFilter) {
      const filterPlaceholder = '<option value="all">All categories</option>';
      const filterOptions = Array.from(ticketsState.categoriasMap.entries())
        .map(([id, label]) => `<option value="${normalizeToken(label)}">${label}</option>`)
        .join("");
      categoryFilter.innerHTML = filterPlaceholder + filterOptions;
    }
  };

  const getTicketCategoryLabel = (ticket) => {
    return String(ticket.category || ticket.classification || "").trim();
  };

  const renderCategoriasFromTickets = () => {
    if (!categoryFilter) return;
    const unique = new Map();
    ticketsState.tickets.forEach((ticket) => {
      const label = getTicketCategoryLabel(ticket);
      if (!label) return;
      unique.set(normalizeToken(label), label);
    });
    const filterPlaceholder = '<option value="all">All categories</option>';
    const options = Array.from(unique.entries())
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
    categoryFilter.innerHTML = filterPlaceholder + options;
  };

  const disableCategorySelect = () => {
    if (!categoryInput) return;
    categoryInput.innerHTML = '<option value="">Categorias no disponibles</option>';
    categoryInput.disabled = true;
    ticketsState.categoriasAvailable = false;
  };

  const loadCategorias = async () => {
    if (!SIGAM_CONFIG.API_BASE_URL) return;
    try {
      const data = await getCategorias();
      ticketsState.categoriasList = Array.isArray(data) ? data : normalizeCategorias(data);
      renderCategorias();
      if (ticketsState.categoriasList.length === 0) {
        renderCategoriasFromTickets();
      }
    } catch (error) {
      setTicketStatus("Unable to load ticket categories from API.", "error");
      disableCategorySelect();
      renderCategoriasFromTickets();
    }
  };

  const renderStatusFilter = () => {
    if (!statusFilter) return;
    const unique = new Map();
    ticketsState.tickets.forEach((ticket) => {
      const label = String(ticket.status || "").trim();
      if (!label) return;
      unique.set(normalizeToken(label), label);
    });
    const placeholder = '<option value="all">All the states</option>';
    const options = Array.from(unique.entries())
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
    statusFilter.innerHTML = placeholder + options;
  };

  const updatePagination = () => {
    if (pageInfo) {
      pageInfo.textContent = `Page ${ticketsState.currentPage}`;
    }
    if (ticketPageInfo) {
      ticketPageInfo.textContent = `Page ${ticketsState.currentPage}`;
    }
    if (prevPageBtn) {
      prevPageBtn.disabled = ticketsState.currentPage <= 1;
    }
    if (nextPageBtn) {
      nextPageBtn.disabled = !ticketsState.hasMore;
    }
    if (ticketPrevBtn) {
      ticketPrevBtn.disabled = ticketsState.currentPage <= 1;
    }
    if (ticketNextBtn) {
      ticketNextBtn.disabled = !ticketsState.hasMore;
    }
  };

  const loadTickets = async (page = 1) => {
    if (!SIGAM_CONFIG.API_BASE_URL) {
      setTicketStatus("API not available.", "error");
      setListStatus("API not available.", "error");
      return;
    }
    try {
      ticketsState.currentPage = page;
      const offset = (ticketsState.currentPage - 1) * ticketsState.pageSize;
      const data = await getTickets({ limit: ticketsState.pageSize, offset });
      ticketsState.tickets = (data || []).map((item) => normalizeTicket(item));
      ticketsState.hasMore = Array.isArray(data) && data.length === ticketsState.pageSize;
      localStorage.setItem("tickets", JSON.stringify(ticketsState.tickets));
      renderStatusFilter();
      applyFilters();
      updatePagination();
    } catch (error) {
      const status = error && error.status ? error.status : null;
      if (status === 401) {
        setListStatus("Session expired. Please log in again.", "error");
        setTimeout(() => { router.navigateTo("/login", { replace: true }); }, 800);
      } else if (status === 429) {
        setListStatus("Too many requests. Please wait and try again.", "error");
      } else if (status === 500) {
        setListStatus("Server error loading tickets.", "error");
      } else {
        setListStatus("Unable to load tickets from API.", "error");
      }
      const cached = JSON.parse(localStorage.getItem("tickets") || "[]");
      ticketsState.tickets = cached.map((item) => normalizeTicket(item));
      ticketsState.hasMore = false;
      renderStatusFilter();
      applyFilters();
      updatePagination();
    }
  };

  const setTicketView = (mode) => {
    const isList = mode === "list";
    if (ticketGrid) ticketGrid.classList.toggle("d-none", isList);
    if (ticketListView) ticketListView.classList.toggle("d-none", !isList);
    if (ticketViewGridBtn) ticketViewGridBtn.classList.toggle("active", !isList);
    if (ticketViewListBtn) ticketViewListBtn.classList.toggle("active", isList);
    ticketsState.viewMode = isList ? "list" : "grid";
  };

  const renderTicketGrid = (list) => {
    if (!ticketGrid) return;
    ticketGrid.innerHTML = "";

    if (list.length === 0) {
      ticketGrid.innerHTML = "<p>No matching tickets found.</p>";
      renderCategoriasFromTickets();
      return;
    }

    list.forEach((ticket, index) => {
      const div = document.createElement("div");
      div.classList.add("ticket", "ticket-card");
      const statusClass = mapStatusClass(ticket.status);
      if (statusClass) {
        div.classList.add(statusClass);
      }
      div.innerHTML = renderTicketCardBody({
        ticket,
        index,
        statusClass: mapStatusClass
      });
      div.addEventListener("click", (event) => {
        if (event.target.closest(".delete-btn")) return;
        if (ticket.id) {
          router.navigateTo(`/ticket-detail?id=${encodeURIComponent(ticket.id)}`);
        }
      });
      ticketGrid.appendChild(div);
    });
  };

  const renderTicketList = (list) => {
    if (!ticketListBody) return;
    if (list.length === 0) {
      ticketListBody.innerHTML = '<tr><td colspan="7" class="text-muted">No matching tickets found.</td></tr>';
      return;
    }

    ticketListBody.innerHTML = list.map((ticket) => {
      const categoryLabel = ticket.category || ticket.classification || "Sin categoria";
      const assignedLabel = ticket.assignedTo || "Sin asignar";
      const statusLabel = ticket.status || "Pending";
      const statusClass = mapStatusClass(ticket.status);
      return `
        <tr data-ticket-id="${ticket.id || ""}" class="ticket-row ${statusClass}">
          <td>TK-${ticket.id || ""}</td>
          <td><span class="ticket-status ${mapStatusClass(ticket.status)}">${statusLabel}</span></td>
          <td>${ticket.title || "Ticket"}</td>
          <td>${ticket.device || "Activo"}</td>
          <td>${categoryLabel}</td>
          <td>${assignedLabel}</td>
          <td>${ticket.date || ""}</td>
        </tr>
      `;
    }).join("");

    ticketListBody.querySelectorAll("tr[data-ticket-id]").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-ticket-id");
        if (id) {
          router.navigateTo(`/ticket-detail?id=${encodeURIComponent(id)}`);
        }
      });
    });
  };

  const renderTickets = (list) => {
    renderTicketGrid(list);
    renderTicketList(list);
  };

  setTicketView("grid");

  const applyFilters = () => {
    const search = normalizeToken(searchInput ? searchInput.value : "");
    const status = normalizeToken(statusFilter ? statusFilter.value : "");
    const category = categoryFilter ? normalizeToken(categoryFilter.value) : "all";

    const filtered = ticketsState.tickets.filter((ticket) => {
      const title = normalizeToken(ticket.title);
      const description = normalizeToken(ticket.description);
      const device = normalizeToken(ticket.device);
      const ticketCategory = normalizeToken(getTicketCategoryLabel(ticket));

      const matchSearch =
        title.includes(search) ||
        description.includes(search) ||
        device.includes(search) ||
        ticketCategory.includes(search);

      const matchStatus = status === "all" || (ticket.statusNormalized || "").includes(status);
      const matchCategory = category === "all" || ticketCategory.includes(category);

      return matchSearch && matchStatus && matchCategory;
    });

    renderTickets(filtered);
    renderCategoriasFromTickets();
    if (ticketsCount) {
      ticketsCount.textContent = `${filtered.length} tickets`;
    }
  };

  if (ticketViewGridBtn) {
    ticketViewGridBtn.addEventListener("click", () => setTicketView("grid"));
  }
  if (ticketViewListBtn) {
    ticketViewListBtn.addEventListener("click", () => setTicketView("list"));
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTicketStatus("", "loading");

    if (!validateTicketForm()) {
      setTicketStatus("Please fix the highlighted fields.", "error");
      return;
    }

    if (!SIGAM_CONFIG.API_BASE_URL) {
      setTicketStatus("API not available.", "error");
      return;
    }

    setSubmitting(addTicketBtn, true, "Add Ticket");

    const user = getCurrentUser() || {};
    const reporterId = user.id || user.id_usuario || user.userId || "";
    const serialValue = deviceInput.value.trim();
    const matchedActivo = ticketsState.activosBySerial.get(serialValue.toLowerCase());
    const assetId = matchedActivo
      ? (matchedActivo.id_activo || matchedActivo.id || matchedActivo.idActivo)
      : "";

    if (!reporterId) {
      setTicketStatus("You must sign in to create a ticket.", "error");
      setSubmitting(addTicketBtn, false, "Add Ticket");
      return;
    }

    if (!assetId) {
      setTicketStatus("Serial not found. Please verify the asset.", "error");
      setSubmitting(addTicketBtn, false, "Add Ticket");
      return;
    }

    const ticketPayload = {
      id_activo: Number(assetId) || assetId,
      descripcion: descriptionInput.value.trim()
    };

    const categoryValue = categoryInput.value;
    if (categoryValue) {
      ticketPayload.id_categoria_ticket = Number(categoryValue) || categoryValue;
    }

    try {
      await createTicket(ticketPayload);
      await loadTickets(ticketsState.currentPage);
      ticketForm.reset();
      clearFormErrors();
      setTicketStatus("Ticket created successfully.", "success");
      if (modal) modal.style.display = "none";
    } catch (error) {
      setTicketStatus("Unable to create ticket. Please try again.", "error");
    } finally {
      setSubmitting(addTicketBtn, false, "Add Ticket");
    }
  };

  if (openBtn && modal) {
    openBtn.onclick = () => {
      modal.style.display = "flex";
      setTicketStatus("", "");
      clearFormErrors();
    };
  }

  if (closeBtn && modal) {
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  if (ticketForm) {
    ticketForm.addEventListener("submit", handleSubmit);
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener("change", applyFilters);
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (ticketsState.currentPage > 1) {
        loadTickets(ticketsState.currentPage - 1);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
      if (ticketsState.hasMore) {
        loadTickets(ticketsState.currentPage + 1);
      }
    });
  }

  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      const nextSize = Number(pageSizeSelect.value) || 20;
      ticketsState.pageSize = nextSize;
      loadTickets(1);
    });
  }

  if (ticketPrevBtn) {
    ticketPrevBtn.addEventListener("click", () => {
      if (ticketsState.currentPage <= 1) return;
      loadTickets(ticketsState.currentPage - 1);
    });
  }

  if (ticketNextBtn) {
    ticketNextBtn.addEventListener("click", () => {
      if (!ticketsState.hasMore) return;
      loadTickets(ticketsState.currentPage + 1);
    });
  }

  setCreatedByFromSession();
  Promise.allSettled([loadActivos(), loadCategorias()]).finally(() => {
    loadTickets(1);
  });
};

export const TicketsPage = {
  render,
  init,
  meta: {
    bodyClass: "page-tickets",
    roles: ROLE_ALLOWLIST
  }
};
