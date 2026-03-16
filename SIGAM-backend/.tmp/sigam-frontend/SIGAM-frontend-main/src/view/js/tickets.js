let tickets = [];
let activosMap = new Map();
let activosBySerial = new Map();
let activosList = [];
let categoriasMap = new Map();
let categoriasList = [];

const api = window.SIGAM_API;
const statusFilter = document.getElementById("statusFilter");
const modal = document.getElementById("ticketModal");
const openBtn = document.getElementById("newTicketBtn");
const closeBtn = document.querySelector(".close");

const ticketForm = document.getElementById("ticketForm");
const addTicketBtn = document.getElementById("addTicket");
const ticketList = document.getElementById("ticketList");

const searchInput = document.getElementById("searchInput");
const ticketStatusEl = document.getElementById("ticketStatus");
const ticketsCount = document.getElementById("contadorTickets");

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const deviceInput = document.getElementById("device");
const deviceList = document.getElementById("deviceList");
const categoryInput = document.getElementById("category");
const createdByInput = document.getElementById("createdBy");
const assignedToInput = document.getElementById("assignedTo");
const estimateInput = document.getElementById("estimate");
const statusInput = document.getElementById("status");

/* abrir modal */
openBtn.onclick = () => {
    modal.style.display = "flex";
    setTicketStatus("");
    clearFormErrors();
};

/* cerrar modal */
closeBtn.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

function setTicketStatus(message, type) {
    if (!ticketStatusEl) {
        return;
    }
    ticketStatusEl.textContent = message || "";
    ticketStatusEl.style.color = "#6b7280";
    if (type === "error") {
        ticketStatusEl.style.color = "#dc2626";
    }
    if (type === "success") {
        ticketStatusEl.style.color = "#059669";
    }
}

function setSubmitting(isSubmitting) {
    if (!addTicketBtn) {
        return;
    }
    addTicketBtn.disabled = isSubmitting;
    addTicketBtn.textContent = isSubmitting ? "Saving..." : "Add Ticket";
}

function getCurrentUser() {
    if (!api || !api.getUser) {
        return null;
    }
    return api.getUser();
}

function setCreatedByFromSession() {
    const user = getCurrentUser();
    if (!createdByInput) {
        return;
    }
    if (user && (user.nombre || user.name || user.email)) {
        createdByInput.value = user.nombre || user.name || user.email;
        return;
    }
    createdByInput.value = "Usuario";
}

function setFieldError(input, message) {
    if (!input) {
        return;
    }
    const errorEl = document.getElementById(`${input.id}Error`);
    if (message) {
        input.classList.add("input-error");
        if (errorEl) {
            errorEl.textContent = message;
        }
    } else {
        input.classList.remove("input-error");
        if (errorEl) {
            errorEl.textContent = "";
        }
    }
}

function validateTicketForm() {
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

    if (!categoryInput.value) {
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
}

function clearFormErrors() {
    setFieldError(titleInput, "");
    setFieldError(descriptionInput, "");
    setFieldError(deviceInput, "");
    setFieldError(categoryInput, "");
    setFieldError(createdByInput, "");
    setFieldError(assignedToInput, "");
    setFieldError(estimateInput, "");
    setFieldError(statusInput, "");
}

function normalizeTicket(raw) {
    const createdAt =
        raw.createdAt ||
        raw.date ||
        raw.created_at ||
        raw.created_on ||
        raw.fecha_creacion;
    const idActivo = raw.id_activo || raw.activoId || raw.assetId;
    const activoInfo = activosMap.get(String(idActivo)) || {};
    const rawStatus = raw.status || raw.estado || "";
    const normalizedStatus = String(rawStatus || "").toLowerCase().trim();
    const categoryId = raw.id_categoria || raw.categoria_id || raw.categoriaId;
    const categoryLabel =
        raw.category ||
        raw.categoria ||
        raw.categoria_nombre ||
        (categoryId ? categoriasMap.get(String(categoryId)) : "") ||
        (activoInfo.raw && (activoInfo.raw.categoria || activoInfo.raw.categoria_nombre)) ||
        "";
    return {
        id: raw.id || raw._id || raw.ticketId || raw.codigo || raw.id_ticket,
        title: raw.title || raw.titulo || raw.asunto || raw.descripcion || "",
        description: raw.description || raw.descripcion || "",
        device: raw.device || raw.dispositivo || activoInfo.label || "",
        category: categoryLabel,
        createdBy: raw.createdBy || raw.creadoPor || raw.created_by || raw.usuario_reporta || "",
        assignedTo: raw.assignedTo || raw.asignadoA || raw.assigned_to || raw.usuario_asignado || "",
        estimate: raw.estimate || raw.tiempoEstimado || raw.estimated || "",
        status: rawStatus,
        statusNormalized: normalizedStatus,
        assetId: idActivo || "",
        date: createdAt ? new Date(createdAt).toLocaleDateString() : ""
    };
}

async function loadActivos() {
    if (!api || !api.getActivos) {
        return;
    }
    try {
        const data = await api.getActivos();
        activosList = Array.isArray(data) ? data : [];
        activosMap = new Map(
            activosList.map((activo) => {
                const id = activo.id_activo || activo.id || activo.idActivo;
                const labelParts = [
                    activo.modelo,
                    activo.serial,
                    activo.sede,
                    activo.sala
                ].filter(Boolean);
                const label = labelParts.join(" - ");
                return [String(id), { label, raw: activo }];
            })
        );
        activosBySerial = new Map(
            activosList
                .filter((activo) => activo.serial)
                .map((activo) => [String(activo.serial).trim().toLowerCase(), activo])
        );

        if (deviceList) {
            deviceList.innerHTML = activosList
                .map((activo) => activo.serial)
                .filter(Boolean)
                .map((serial) => `<option value="${String(serial).trim()}"></option>`)
                .join("");
        }
    } catch (error) {
        setTicketStatus("Unable to load assets from API.", "error");
    }
}

async function loadCategorias() {
    if (!api || !api.getCategorias) {
        return;
    }
    try {
        const data = await api.getCategorias();
        categoriasList = Array.isArray(data) ? data : [];
        categoriasMap = new Map(
            categoriasList.map((categoria) => {
                const id = categoria.id_categoria || categoria.id || categoria.idCategoria;
                const label = categoria.nombre || categoria.name || categoria.categoria || String(id || "Categoria");
                return [String(id), label];
            })
        );

        if (categoryInput) {
            const placeholder = '<option value="">Selecciona categoria</option>';
            const options = categoriasList
                .map((categoria) => {
                    const id = categoria.id_categoria || categoria.id || categoria.idCategoria;
                    const label = categoriasMap.get(String(id)) || String(id || "Categoria");
                    return `<option value="${id}">${label}</option>`;
                })
                .join("");
            categoryInput.innerHTML = placeholder + options;
        }
    } catch (error) {
        setTicketStatus("Unable to load categories from API.", "error");
    }
}

async function loadTickets() {
    if (!api || !api.getTickets) {
        setTicketStatus("API not available.", "error");
        return;
    }
    try {
        const data = await api.getTickets();
        tickets = (data || []).map(normalizeTicket);
        localStorage.setItem("tickets", JSON.stringify(tickets));
        applyFilters();
    } catch (error) {
        setTicketStatus("Unable to load tickets from API.", "error");
        const cached = JSON.parse(localStorage.getItem("tickets") || "[]");
        tickets = cached.map(normalizeTicket);
        applyFilters();
    }
}

if (ticketForm) {
    ticketForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setTicketStatus("", "loading");

        if (!validateTicketForm()) {
            setTicketStatus("Please fix the highlighted fields.", "error");
            return;
        }

        if (!api || !api.createTicket) {
            setTicketStatus("API not available.", "error");
            return;
        }

        setSubmitting(true);

        const user = getCurrentUser() || {};
        const reporterId = user.id || user.id_usuario || user.userId || "";
        const serialValue = deviceInput.value.trim();
        const matchedActivo = activosBySerial.get(serialValue.toLowerCase());
        const assetId = matchedActivo
            ? (matchedActivo.id_activo || matchedActivo.id || matchedActivo.idActivo)
            : "";

        if (!reporterId) {
            setTicketStatus("Debes iniciar sesión para crear un ticket.", "error");
            setSubmitting(false);
            return;
        }

        if (!assetId) {
            setTicketStatus("Serial no encontrado. Verifica el activo.", "error");
            setSubmitting(false);
            return;
        }

        const ticketPayload = {
            id_activo: Number(assetId) || assetId,
            descripcion: descriptionInput.value.trim()
        };

        const categoryValue = categoryInput.value;
        if (categoryValue) {
            ticketPayload.id_categoria = Number(categoryValue) || categoryValue;
        }

        try {
            await api.createTicket(ticketPayload);
            await loadTickets();
            ticketForm.reset();
            clearFormErrors();
            setTicketStatus("Ticket created successfully.", "success");
            modal.style.display = "none";
        } catch (error) {
            setTicketStatus("Unable to create ticket. Please try again.", "error");
        } finally {
            setSubmitting(false);
        }
    });
}

function renderTickets(list) {
    ticketList.innerHTML = "";

    if (list.length === 0) {
        ticketList.innerHTML = "<p>No hay tickets que coincidan</p>";
        return;
    }

    list.forEach((ticket, index) => {
        const div = document.createElement("div");
        div.classList.add("ticket");
        div.innerHTML = `
            <div class="ticket-status">${ticket.status || "Pending"}</div>

            <div class="ticket-title">
                ${ticket.title || "Ticket"}
            </div>

            <div class="ticket-info">
                ${ticket.description}
            </div>

            <div class="ticket-info">
                TK-${ticket.id || index + 1} - ${ticket.device || "Activo"} - ${ticket.category || "Sin categoria"}
            </div>

            <div class="ticket-info">
                Creado por: ${ticket.createdBy} -
                Asignado a: ${ticket.assignedTo || "Sin asignar"} -
                ${ticket.date} -
                ${ticket.estimate || "Sin estimado"}
            </div>

            <button class="delete-btn" onclick="deleteTicket(${index})">Eliminar</button>
        `;
        ticketList.appendChild(div);
    });
}

/* BORRAR TICKET */
async function deleteTicket(index) {
    const ticket = tickets[index];
    if (!ticket) {
        return;
    }

    if (api && api.deleteTicket && ticket.id) {
        try {
            await api.deleteTicket(ticket.id);
        } catch (error) {
            setTicketStatus("Unable to delete ticket from API.", "error");
            return;
        }
    }

    tickets.splice(index, 1);
    localStorage.setItem("tickets", JSON.stringify(tickets));
    applyFilters();
}

function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();

    const filtered = tickets.filter(ticket => {
        const title = (ticket.title || "").toLowerCase();
        const description = (ticket.description || "").toLowerCase();
        const device = (ticket.device || "").toLowerCase();
        const category = (ticket.category || "").toLowerCase();

        const matchSearch =
            title.includes(search) ||
            description.includes(search) ||
            device.includes(search) ||
            category.includes(search);

        const matchStatus =
            status === "all" || (ticket.statusNormalized || "").includes(status);

        return matchSearch && matchStatus;
    });

    renderTickets(filtered);
    if (ticketsCount) {
        ticketsCount.textContent = `${filtered.length} tickets`;
    }
}

searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

setCreatedByFromSession();
Promise.all([loadActivos(), loadCategorias()]).then(loadTickets);
