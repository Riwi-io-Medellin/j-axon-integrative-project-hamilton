import { Navbar } from "../components/Navbar.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { normalizeCollection } from "../utils/normalize.js";
import "../css/pages/dashboard.css";

const ROLE_ALLOWLIST = ["Gerente", "Analista", "Tecnico", "Auditor"];
let pieChartInstance = null;
let barChartInstance = null;
let lineChartInstance = null;

const render = async () => {
  const navbarHTML = Navbar.render();

  return `
        ${navbarHTML}
        <main class="container-dashboard">
            <section class="cards-dashboard">
                <div class="card-activos">
                    <h4>Total Assets</h4>
                    <h2 id="totalAssets">0</h2>
                    <h6>Assets, Under maintenance</h6>
                </div>

                <div class="card-tikects">
                    <h4>tickets Abiertos</h4>
                    <h2 id="openTickets">0</h2>
                    <h6>Critical,In progress</h6>
                </div>

                <div class="card-scheduled">
                    <h6>scheduled maintenance</h6>
                    <h2 id="scheduledMaintenance">0</h2>
                    <h6>Next 30 days</h6>
                </div>

                <div class="card-cost">
                    <h6>total maintenance cost</h6>
                    <h2 id="totalCost">0</h2>
                    <h6>Accumulated history</h6>
                </div>
            </section>

            <section class="charts">
                <div class="charts-card">
                    <h3>Assets by type</h3>
                    <canvas id="footChart"></canvas>
                </div>
                <div>
                    <h3>tickets for category</h3>
                    <canvas id="barChart"></canvas>
                </div>
            </section>

            <div class="chart-card-line">
                <h3>Maintenance Cost Trend</h3>
                <canvas id="lineChart"></canvas>
            </div>

            <div class="maintenance-tickets-container">
                <div class="list-tikects">
                    <h3>Recent Tickets</h3>
                    <div id="recentTickets" class="recent-tickets">
                        <p class="ticket-empty">Loading tickets...</p>
                    </div>
                </div>

                <div class="maintenance">
                    <h3>upcoming maintenance</h3>
                    <div id="upcomingMaintenance">
                        <p class="ticket-empty">Loading maintenance...</p>
                    </div>
                </div>
            </div>
        </main>
    `;
};

const init = async () => {
  Navbar.init();
  try {
    await ensureChartJs();
  } catch (error) {
    console.warn(error);
  }
  await loadDashboardData();
};

const ensureChartJs = () => {
  if (window.Chart) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sigam-chart="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Chart.js failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.setAttribute('data-sigam-chart', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Chart.js failed to load'));
    document.head.appendChild(script);
  });
};

const safeFetch = async (fn) => {
  if (!fn) return [];
  try {
    const data = await fn();
    return Array.isArray(data) ? data : data || [];
  } catch {
    return [];
  }
};

const getTickets = async () => {
  const payload = await api.apiRequest(SIGAM_CONFIG.TICKETS_ENDPOINT);
  return normalizeCollection(payload);
};

const getActivos = async () => {
  const payload = await api.apiRequest(SIGAM_CONFIG.ACTIVOS_ENDPOINT);
  return normalizeCollection(payload);
};

const getMantenimientos = async () => {
  const payload = await api.apiRequest(SIGAM_CONFIG.MANTENIMIENTOS_ENDPOINT);
  return normalizeCollection(payload);
};

const loadDashboardData = async () => {
  const recentContainer = document.querySelector('#recentTickets');
  const maintenanceContainer = document.querySelector('#upcomingMaintenance');

  if (!SIGAM_CONFIG.API_BASE_URL) {
    if (recentContainer) {
      recentContainer.innerHTML = '<p class="ticket-empty">API not available.</p>';
    }
    if (maintenanceContainer) {
      maintenanceContainer.innerHTML = '<p class="ticket-empty">API not available.</p>';
    }
    return;
  }

  const [activos, tickets, mantenimientos] = await Promise.all([
    safeFetch(getActivos),
    safeFetch(getTickets),
    safeFetch(getMantenimientos)
  ]);

  const data = buildDashboardData(activos, tickets, mantenimientos);
  updateCards(data);
  createCharts(data);

  if (recentContainer) {
    renderRecentTickets(recentContainer, (tickets || []).map((item) => normalizeTicket(item)));
  }
  if (maintenanceContainer) {
    renderUpcomingMaintenance(maintenanceContainer, mantenimientos);
  }
};

const normalizeTicket = (raw) => {
  const createdAt = raw.createdAt || raw.date || raw.created_at || raw.created_on || raw.fecha_creacion;
  const status = raw.status || raw.estado || raw.estado_ticket || raw.estado_actual || raw.status_ticket || '';
  const createdDate = createdAt ? new Date(createdAt) : null;
  return {
    id: raw.id || raw._id || raw.ticketId || raw.codigo || raw.id_ticket,
    title: raw.title || raw.titulo || raw.asunto || '',
    device: raw.device || raw.dispositivo || '',
    category: raw.category || raw.categoria || '',
    status,
    createdAt: createdDate
  };
};

const renderRecentTickets = (container, list) => {
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

  container.innerHTML = '';
  recent.forEach((ticket) => {
    const item = document.createElement('div');
    item.className = 'recent-ticket';
    const ui = mapStatus(ticket.status);
    item.innerHTML = `
            <span class="dot ${ui.dot}" style="background:${ui.dotColor}"></span>
            <div>
                <strong>${ticket.title || 'Untitled ticket'}</strong>
                <p>${ticket.device || ticket.category || 'No details'}</p>
                <small class="text-muted d-block">
                    ${ticket.createdAt ? ticket.createdAt.toLocaleString() : ''}
                </small>
                <span class="badge ${ui.badge}" style="background:${ui.badgeBg};color:${ui.badgeColor}">
                    ${ui.label}
                </span>
            </div>
        `;
    container.appendChild(item);
  });
};

const mapStatus = (status) => {
  const value = (status || '').toLowerCase();
  if (value.includes('progreso') || value.includes('progress')) {
    return {
      dot: 'status-progress',
      badge: 'badge-progress',
      label: status || 'in progress',
      dotColor: '#f59e0b',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e'
    };
  }
  if (value.includes('complet') || value.includes('resolved') || value.includes('cerrad') || value.includes('resuelt')) {
    return {
      dot: 'status-resolved',
      badge: 'badge-resolved',
      label: status || 'resolved',
      dotColor: '#16a34a',
      badgeBg: '#dcfce7',
      badgeColor: '#166534'
    };
  }
  if (value.includes('pend') || value.includes('open') || value.includes('abiert')) {
    return {
      dot: 'status-open',
      badge: 'badge-open',
      label: status || 'open',
      dotColor: '#dc2626',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c'
    };
  }
  return {
    dot: 'status-open',
    badge: 'badge-open',
    label: status || 'open',
    dotColor: '#dc2626',
    badgeBg: '#fee2e2',
    badgeColor: '#b91c1c'
  };
};

const buildDashboardData = (activos, tickets, mantenimientos) => {
  const safeActivos = Array.isArray(activos) ? activos : [];
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const safeMaint = Array.isArray(mantenimientos) ? mantenimientos : [];
  const openTickets = safeTickets.filter((ticket) => {
    const status = (ticket.estado || ticket.status || '').toLowerCase();
    return !status.includes('cerrad') && !status.includes('complet');
  }).length;

  const ticketsByCategory = {};
  safeTickets.forEach((ticket) => {
    const category = ticket.categoria || ticket.category || ticket.tipo || 'Sin categoria';
    const label = String(category || 'Sin categoria');
    ticketsByCategory[label] = (ticketsByCategory[label] || 0) + 1;
  });

  const assetsByType = {
    laptops: 0,
    desktops: 0,
    servers: 0,
    printers: 0,
    monitors: 0,
    others: 0
  };
  safeActivos.forEach((asset) => {
    const model = String(asset.modelo || asset.nombre || asset.marca || '').toLowerCase();
    if (model.includes('laptop') || model.includes('notebook')) {
      assetsByType.laptops += 1;
    } else if (model.includes('server')) {
      assetsByType.servers += 1;
    } else if (model.includes('printer') || model.includes('impresora')) {
      assetsByType.printers += 1;
    } else if (model.includes('monitor')) {
      assetsByType.monitors += 1;
    } else if (model.includes('desktop') || model.includes('pc')) {
      assetsByType.desktops += 1;
    } else {
      assetsByType.others += 1;
    }
  });

  const totalCost = safeMaint.reduce((sum, m) => {
    const raw = m.costo || m.costo_total || m.costo_mantenimiento || m.total_cost || m.cost;
    const value = Number.parseFloat(raw || '0');
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const scheduledMaintenance = countUpcoming(safeMaint, 30);

  return {
    assets: safeActivos.length,
    openTickets,
    scheduledMaintenance,
    totalCost,
    assetsByType,
    ticketsByCategory,
    maintenanceCost: buildMaintenanceTrend(safeMaint)
  };
};

const updateCards = (data) => {
  const assetsEl = document.querySelector('.card-activos h2');
  const ticketsEl = document.querySelector('.card-tikects h2');
  const scheduledEl = document.querySelector('.card-scheduled h2');
  const costEl = document.querySelector('.card-cost h2');

  if (assetsEl) assetsEl.textContent = data.assets ?? '-';
  if (ticketsEl) ticketsEl.textContent = data.openTickets ?? '-';
  if (scheduledEl) scheduledEl.textContent = data.scheduledMaintenance ?? '-';
  if (costEl) {
    costEl.textContent = data.totalCost ? `$${Math.round(data.totalCost)}` : '-';
  }
};

const createCharts = (data) => {
  if (typeof window.Chart === 'undefined') return;
  createPieChart(data);
  createBarChart(data);
  createLineChart(data);
};

const createPieChart = (data) => {
  const footChart = document.querySelector('#footChart');
  if (!footChart) return;
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }
  pieChartInstance = new window.Chart(footChart, {
    type: 'pie',
    data: {
      labels: ['Laptops', 'Desktops', 'Servers', 'Printers', 'Monitors', 'Others'],
      datasets: [{
        data: [
          data.assetsByType?.laptops ?? 0,
          data.assetsByType?.desktops ?? 0,
          data.assetsByType?.servers ?? 0,
          data.assetsByType?.printers ?? 0,
          data.assetsByType?.monitors ?? 0,
          data.assetsByType?.others ?? 0
        ],
        backgroundColor: [
          '#4e73df',
          '#1cc88a',
          '#f6c23e',
          '#e74a3b',
          '#858796',
          '#9ca3af'
        ]
      }]
    },
    options: {
      responsive: true
    }
  });
};

const createBarChart = (data) => {
  const barChart = document.querySelector('#barChart');
  if (!barChart) return;
  const labels = Object.keys(data.ticketsByCategory || {});
  const values = labels.map((label) => data.ticketsByCategory[label] || 0);
  if (barChartInstance) {
    barChartInstance.destroy();
  }
  barChartInstance = new window.Chart(barChart, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Sin categoria'],
      datasets: [{
        label: 'Tickets',
        data: [
          ...(values.length ? values : [0])
        ],
        backgroundColor: '#4e73df'
      }]
    },
    options: {
      responsive: true
    }
  });
};

const createLineChart = (data) => {
  const lineCtx = document.querySelector('#lineChart');
  if (!lineCtx) return;
  if (lineChartInstance) {
    lineChartInstance.destroy();
  }
  const trend = Array.isArray(data.maintenanceCost) ? data.maintenanceCost : [];
  lineChartInstance = new window.Chart(lineCtx, {
    type: 'line',
    data: {
      labels: trend.map((item) => item.label),
      datasets: [{
        label: 'Maintenance Cost',
        data: trend.map((item) => item.value),
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78,115,223,0.1)',
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
};

const renderUpcomingMaintenance = (container, list) => {
  const maints = Array.isArray(list) ? list : [];
  if (!maints.length) {
    container.innerHTML = '<p class="ticket-empty">No upcoming maintenance.</p>';
    return;
  }
  const upcoming = maints
    .map((item) => normalizeMaintenance(item))
    .filter((m) => m.date && m.date >= todayISO())
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 5);

  if (!upcoming.length) {
    container.innerHTML = '<p class="ticket-empty">No upcoming maintenance.</p>';
    return;
  }

  container.innerHTML = '';
  upcoming.forEach((m) => {
    const title = m.asset || (m.ticketId ? `Ticket #${m.ticketId}` : 'Maintenance');
    const subtitle = m.notes || m.type || 'Maintenance scheduled';
    const dateLabel = m.date ? new Date(m.date).toLocaleDateString() : '';
    const item = document.createElement('div');
    item.className = 'maintenance-next';
    item.innerHTML = `
            <h4>${title}</h4>
            <h6>${subtitle}</h6>
            <h6>${dateLabel}</h6>
        `;
    container.appendChild(item);
  });
};

const normalizeMaintenance = (raw) => ({
  id: raw.id || raw.id_mantenimiento || raw.id_mantenimiento_orden || '',
  ticketId: raw.id_ticket || raw.ticketId || '',
  asset: raw.activo || raw.asset || raw.assetName || '',
  type: raw.tipo || raw.type || '',
  date: raw.fecha_inicio || raw.fecha_programada || raw.date || '',
  notes: raw.diagnostico || raw.notes || ''
});

const todayISO = () => new Date().toISOString().split('T')[0];

const countUpcoming = (list, days) => {
  const today = todayISO();
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  const limitStr = limit.toISOString().split('T')[0];
  return (list || [])
    .map((m) => normalizeMaintenance(m))
    .filter((m) => m.date && m.date >= today && m.date <= limitStr).length;
};

const buildMaintenanceTrend = (list) => {
  const months = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short' });
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label,
      value: 0
    });
  }
  const monthMap = new Map(months.map((m) => [m.key, m]));
  (list || []).forEach((m) => {
    const normalized = normalizeMaintenance(m);
    if (!normalized.date) return;
    const key = normalized.date.slice(0, 7);
    if (!monthMap.has(key)) return;
    const costRaw = m.costo || m.costo_total || m.costo_mantenimiento || m.total_cost || m.cost;
    const cost = Number.parseFloat(costRaw || '0');
    if (!Number.isFinite(cost)) return;
    monthMap.get(key).value += cost;
  });
  return months;
};

export const DashboardPage = {
  render,
  init,
  meta: {
    bodyClass: "page-dashboard",
    roles: ROLE_ALLOWLIST
  }
};
