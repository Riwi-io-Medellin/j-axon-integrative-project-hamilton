const api = window.SIGAM_API;

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
    loadRecentTickets();
});

async function loadDashboardData() {
    try {
        if (!api || !api.getActivos || !api.getTickets) {
            console.error("Dashboard API not available.");
            return;
        }
        const [activos, tickets] = await Promise.all([
            api.getActivos(),
            api.getTickets()
        ]);
        const data = buildDashboardData(activos, tickets);
        if (!data) {
            return;
        }
        updateCards(data);
        createCharts(data);
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

async function loadRecentTickets() {
    const container = document.getElementById("recentTickets");
    if (!container) {
        return;
    }
    if (!api || !api.getTickets) {
        container.innerHTML = '<p class="ticket-empty">API not available.</p>';
        return;
    }
    try {
        const data = await api.getTickets();
        const tickets = (data || []).map(normalizeTicket);
        renderRecentTickets(container, tickets);
    } catch (error) {
        console.error("Error loading tickets:", error);
        container.innerHTML = '<p class="ticket-empty">Unable to load tickets.</p>';
    }
}

function normalizeTicket(raw) {
    const createdAt =
        raw.createdAt ||
        raw.date ||
        raw.created_at ||
        raw.created_on ||
        raw.fecha_creacion;
    const createdDate = createdAt ? new Date(createdAt) : null;
    return {
        id: raw.id || raw._id || raw.ticketId || raw.codigo || raw.id_ticket,
        title: raw.title || raw.titulo || raw.asunto || "",
        device: raw.device || raw.dispositivo || "",
        category: raw.category || raw.categoria || "",
        status: raw.status || raw.estado || "",
        createdAt: createdDate
    };
}

function renderRecentTickets(container, list) {
    if (!Array.isArray(list) || list.length === 0) {
        container.innerHTML = '<p class="ticket-empty">No recent tickets.</p>';
        return;
    }

    const recent = list
        .slice()
        .sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt ? b.createdAt.getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, 5);

    container.innerHTML = "";
    recent.forEach(ticket => {
        const item = document.createElement("div");
        item.className = "recent-ticket";
        const ui = mapStatus(ticket.status);
        item.innerHTML = `
            <span class="dot ${ui.dot}"></span>
            <div>
                <strong>${ticket.title || "Untitled ticket"}</strong>
                <p>${ticket.device || ticket.category || "No details"}</p>
                <small class="text-muted d-block">
                    ${ticket.createdAt ? ticket.createdAt.toLocaleString() : ""}
                </small>
                <span class="badge ${ui.badge}">${ui.label}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function mapStatus(status) {
    const value = (status || "").toLowerCase();
    if (value.includes("progreso") || value.includes("progress")) {
        return { dot: "in-progress", badge: "progress", label: status || "in progress" };
    }
    if (value.includes("complet") || value.includes("resolved") || value.includes("cerrad")) {
        return { dot: "resolved", badge: "alert-resolved", label: status || "resolved" };
    }
    if (value.includes("pend") || value.includes("open")) {
        return { dot: "open", badge: "alert-open", label: status || "open" };
    }
    return { dot: "open", badge: "alert-open", label: status || "open" };
}

function buildDashboardData(activos, tickets) {
    const safeActivos = Array.isArray(activos) ? activos : [];
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    const openTickets = safeTickets.filter((ticket) => {
        const status = (ticket.estado || ticket.status || "").toLowerCase();
        return !status.includes("cerrad") && !status.includes("complet");
    }).length;

    const ticketsByCategory = safeTickets.reduce(
        (acc, ticket) => {
            const category = (ticket.categoria || ticket.category || "").toLowerCase();
            if (category.includes("hard")) {
                acc.hardware += 1;
            } else if (category.includes("soft")) {
                acc.software += 1;
            }
            return acc;
        },
        { hardware: 0, software: 0 }
    );

    return {
        assets: safeActivos.length,
        openTickets,
        scheduledMaintenance: 0,
        totalCost: 0,
        assetsByType: {
            laptops: 0,
            desktops: 0,
            servers: 0,
            printers: 0,
            monitors: 0
        },
        ticketsByCategory,
        maintenanceCost: []
    };
}

// actualizar tarjetas del dashboard
function updateCards(data) {
    const assetsEl = document.querySelector(".card-activos h2");
    const ticketsEl = document.querySelector(".card-tikects h2");
    const scheduledEl = document.querySelector(".card-scheduled h2");
    const costEl = document.querySelector(".card-cost h2");

    if (assetsEl) assetsEl.textContent = data.assets ?? "-";
    if (ticketsEl) ticketsEl.textContent = data.openTickets ?? "-";
    if (scheduledEl) scheduledEl.textContent = data.scheduledMaintenance ?? "-";
    if (costEl) costEl.textContent = data.totalCost ? `$${data.totalCost}` : "-";
}

// crear todas las graficas
function createCharts(data) {
    if (typeof Chart === "undefined") {
        return;
    }
    createPieChart(data);
    createBarChart(data);
    createLineChart(data);
}

// grafica de assets por tipo
function createPieChart(data) {
    const footChart = document.getElementById("footChart");
    if (!footChart) {
        return;
    }
    new Chart(footChart, {
        type: "pie",
        data: {
            labels: ["Laptops", "Desktops", "Servers", "Printers", "Monitors"],
            datasets: [{
                data: [
                    data.assetsByType?.laptops ?? 0,
                    data.assetsByType?.desktops ?? 0,
                    data.assetsByType?.servers ?? 0,
                    data.assetsByType?.printers ?? 0,
                    data.assetsByType?.monitors ?? 0
                ],
                backgroundColor: [
                    "#4e73df",
                    "#1cc88a",
                    "#f6c23e",
                    "#e74a3b",
                    "#858796"
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// grafica de tickets por categoria
function createBarChart(data) {
    const barChart = document.getElementById("barChart");
    if (!barChart) {
        return;
    }
    new Chart(barChart, {
        type: "bar",
        data: {
            labels: ["Hardware", "Software"],
            datasets: [{
                label: "Tickets",
                data: [
                    data.ticketsByCategory?.hardware ?? 0,
                    data.ticketsByCategory?.software ?? 0
                ],
                backgroundColor: "#4e73df"
            }]
        },
        options: {
            responsive: true
        }
    });
}

// grafica de costos de mantenimiento
function createLineChart(data) {
    const lineCtx = document.getElementById("lineChart");
    if (!lineCtx) {
        return;
    }
    new Chart(lineCtx, {
        type: "line",
        data: {
            labels: ["Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb"],
            datasets: [{
                label: "Maintenance Cost",
                data: Array.isArray(data.maintenanceCost) ? data.maintenanceCost : [],
                borderColor: "#4e73df",
                backgroundColor: "rgba(78,115,223,0.1)",
                tension: 0.4,
                fill: true,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}
