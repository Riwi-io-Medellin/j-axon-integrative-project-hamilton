import { Navbar } from "../components/Navbar.js";
import { renderAssetCard } from "../components/AssetCard.js";
import { renderButton } from "../components/Button.js";
import { api } from "../services/api-client.js";
import SIGAM_CONFIG from "../services/config.js";
import { router } from "../router.js";
import { normalizeCollection } from "../utils/normalize.js";
import "../css/pages/inventory.css";

const ROLE_ALLOWLIST = ["Gerente", "Analista"];

const render = async () => {
  const navbarHTML = Navbar.render();

  return `
    ${navbarHTML}
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold">Assets Inventory</h2>
          <p class="text-muted">
            Complete management of IT equipment and devices
          </p>
          <div id="inventoryStatus" class="text-muted small"></div>
        </div>

        <div class="d-flex gap-2 align-items-center">
          ${renderButton({
            label: "+ New Asset",
            variant: "dark",
            attrs: { "data-bs-toggle": "modal", "data-bs-target": "#assetModal" }
          })}
        </div>
      </div>

      <div class="modal fade" id="assetModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">New Asset</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <form id="assetForm" novalidate>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label" for="name">Name</label>
                  <input id="name" class="form-control" required>
                  <div class="invalid-feedback">Name is required (min 3 characters).</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="brand">Brand / Model</label>
                  <input id="brand" class="form-control" required />
                  <div class="invalid-feedback">Brand / Model is required.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="providerId">Provider</label>
                  <select id="providerId" class="form-select" required>
                    <option value="">Select provider</option>
                  </select>
                  <div class="invalid-feedback">Provider is required.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="serial">Serial</label>
                  <input id="serial" class="form-control" required />
                  <div class="invalid-feedback">Serial is required and must be unique.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="assigned">Assigned To</label>
                  <input id="assigned" class="form-control" />
                </div>

                <div class="mb-3">
                  <label class="form-label" for="location">Location</label>
                  <input id="location" class="form-control" required />
                  <div class="invalid-feedback">Location is required.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="status">Status</label>
                  <select id="status" class="form-select" required>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <div class="invalid-feedback">Status is required.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="type">Type</label>
                  <select id="type" class="form-select" required>
                    <option value="laptop">Laptop</option>
                    <option value="desktop">Desktop</option>
                    <option value="server">Server</option>
                    <option value="printer">Printer</option>
                    <option value="monitor">Monitor</option>
                    <option value="tv">TV</option>
                    <option value="router">Router</option>
                  </select>
                  <div class="invalid-feedback">Type is required.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="warranty">Warranty</label>
                  <input id="warranty" class="form-control" required />
                  <div class="invalid-feedback">Warranty is required.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="stock">Stock</label>
                  <input id="stock" type="number" min="0" class="form-control" required />
                  <div class="invalid-feedback">Stock must be 0 or greater.</div>
                </div>
              </div>

              <div class="modal-footer">
                ${renderButton({
                  label: "Cancel",
                  variant: "secondary",
                  attrs: { "data-bs-dismiss": "modal" }
                })}

                <div class="me-auto small" id="assetFormStatus" aria-live="polite"></div>
                ${renderButton({
                  id: "assetSubmitBtn",
                  label: "Save Asset",
                  type: "submit",
                  variant: "dark"
                })}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="card p-3 mb-4 inventory-scroll sigam-section">
        <div class="row g-3">
          <div class="col-md-6">
            <input
              id="searchInput"
              type="text"
              class="form-control"
              placeholder="Search by name, serial, brand..."
            />
          </div>

          <div class="col-md-3">
            <select id="statusFilter" class="form-select">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
            </select>
          </div>

          <div class="col-md-3">
            <select id="typeFilter" class="form-select">
              <option value="all">All Categories</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="server">Server</option>
              <option value="printer">Printer</option>
              <option value="monitor">Monitor</option>
              <option value="tv">TV</option>
              <option value="router">Router</option>
            </select>
          </div>

          <div class="col-md-3">
            <select id="locationFilter" class="form-select">
              <option value="all">All Locations</option>
            </select>
          </div>
        </div>
      </div>

      <ul class="nav nav-tabs mb-3" id="inventoryTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="assets-tab" data-bs-toggle="tab" data-bs-target="#assets-tab-pane" type="button" role="tab" aria-controls="assets-tab-pane" aria-selected="true">Assets</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="suppliers-tab" data-bs-toggle="tab" data-bs-target="#suppliers-tab-pane" type="button" role="tab" aria-controls="suppliers-tab-pane" aria-selected="false">Suppliers Comparison</button>
        </li>
      </ul>

      <div class="tab-content" id="inventoryTabsContent">
        <div class="tab-pane fade show active" id="assets-tab-pane" role="tabpanel" aria-labelledby="assets-tab" tabindex="0">
          <div class="card p-3 mb-4 sigam-section" id="stockTableCard">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0">Stock Alerts</h5>
              <small class="text-muted">Only assets below minimum</small>
            </div>

            <div class="table-responsive inventory-scroll-body" style="max-height:420px; overflow-y:auto;">
              <table class="table table-sm align-middle" id="stockTable">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th class="text-end">Stock</th>
                    <th class="text-end">Min Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="stockTableBody"></tbody>
              </table>
            </div>
          </div>

          <div class="d-flex flex-wrap align-items-center justify-content-between mb-2 gap-2">
            <p id="resultCount" class="text-muted mb-0"></p>
            <div class="btn-group btn-group-sm" role="group" aria-label="Asset view toggle">
              ${renderButton({
                id: "assetViewGrid",
                label: "Grid",
                variant: "outlineDark",
                className: "btn-sm active",
                attrs: { type: "button" }
              })}
              ${renderButton({
                id: "assetViewList",
                label: "List",
                variant: "outlineDark",
                className: "btn-sm",
                attrs: { type: "button" }
              })}
            </div>
            <div class="btn-group btn-group-sm" role="group" aria-label="Assets pagination">
              ${renderButton({
                id: "assetsPrevBtn",
                label: "Prev",
                variant: "outlineDark",
                className: "btn-sm",
                attrs: { type: "button" }
              })}
              ${renderButton({
                id: "assetsNextBtn",
                label: "Next",
                variant: "outlineDark",
                className: "btn-sm",
                attrs: { type: "button" }
              })}
            </div>
            <div id="assetsPageInfo" class="text-muted small"></div>
          </div>

          <div id="assetGrid"></div>
          <div class="card p-3 mb-4 d-none sigam-section" id="assetListView">
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th class="text-end">Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="assetListBody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="tab-pane fade" id="suppliers-tab-pane" role="tabpanel" aria-labelledby="suppliers-tab" tabindex="0">
          <div class="card p-3 mb-4 inventory-scroll sigam-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0">Suppliers Comparison</h5>
              <div class="d-flex align-items-center gap-2">
                <small class="text-muted">Cards by supplier</small>
                <div class="btn-group btn-group-sm" role="group" aria-label="Supplier view toggle">
                  ${renderButton({
                    id: "supplierViewGrid",
                    label: "Cards",
                    variant: "outlineDark",
                    className: "btn-sm active",
                    attrs: { type: "button" }
                  })}
                  ${renderButton({
                    id: "supplierViewList",
                    label: "List",
                    variant: "outlineDark",
                    className: "btn-sm",
                    attrs: { type: "button" }
                  })}
                </div>
              </div>
            </div>

            <div class="inventory-scroll-body" style="max-height:420px; overflow-y:auto; padding-right:8px;">
              <div class="row g-3" id="supplierCards"></div>
              <div class="d-none" id="supplierListView"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="assetEditModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Asset</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form id="assetEditForm">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name</label>
                  <input id="editName" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Brand / Model</label>
                  <input id="editBrand" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Category</label>
                  <select id="editCategoryId" class="form-select"></select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Provider</label>
                  <select id="editProviderId" class="form-select"></select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Serial</label>
                  <input id="editSerial" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Assigned To</label>
                  <input id="editAssigned" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Location</label>
                  <input id="editLocation" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select id="editStatus" class="form-select">
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Type</label>
                  <select id="editType" class="form-select">
                    <option value="laptop">Laptop</option>
                    <option value="desktop">Desktop</option>
                    <option value="server">Server</option>
                    <option value="printer">Printer</option>
                    <option value="monitor">Monitor</option>
                    <option value="tv">TV</option>
                    <option value="router">Router</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Warranty</label>
                  <input id="editWarranty" class="form-control" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Stock</label>
                  <input id="editStock" type="number" min="0" class="form-control" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Minimum Stock</label>
                  <input id="editMinStock" type="number" min="0" class="form-control" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Supplier</label>
                  <input id="editSupplierName" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Supplier Price</label>
                  <input id="editSupplierPrice" type="number" min="0" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Supplier Lead Time (days)</label>
                  <input id="editSupplierLeadTime" type="number" min="0" class="form-control" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              ${renderButton({
                label: "Cancel",
                variant: "secondary",
                attrs: { "data-bs-dismiss": "modal" }
              })}
              ${renderButton({
                label: "Save Changes",
                type: "submit",
                variant: "dark"
              })}
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="modal fade" id="supplierModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Supplier</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form id="supplierForm">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Supplier Name</label>
                <input id="supplierEditName" class="form-control" />
              </div>

              <div class="table-responsive">
                <table class="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th class="text-end">Price</th>
                      <th class="text-end">Lead Time (days)</th>
                    </tr>
                  </thead>
                  <tbody id="supplierEditRows"></tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              ${renderButton({
                label: "Cancel",
                variant: "secondary",
                attrs: { "data-bs-dismiss": "modal" }
              })}
              ${renderButton({
                label: "Save Changes",
                type: "submit",
                variant: "dark"
              })}
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
};

const init = async () => {
  Navbar.init();
  await ensureBootstrapJs();
  initInventory();
};

const ensureBootstrapJs = () => {
  if (window.bootstrap) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sigam-bootstrap="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Bootstrap JS failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js';
    script.async = true;
    script.setAttribute('data-sigam-bootstrap', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Bootstrap JS failed to load'));
    document.head.appendChild(script);
  });
};

const initInventory = () => {
  const apiBaseUrl = SIGAM_CONFIG.API_BASE_URL;
  let assets = [];
  let assetsAll = [];
  let assetsFiltered = [];
  let paginationMode = "server";

  const grid = document.getElementById("assetGrid");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const typeFilter = document.getElementById("typeFilter");
  const locationFilter = document.getElementById("locationFilter");
  const resultCount = document.getElementById("resultCount");
  const inventoryStatus = document.getElementById("inventoryStatus");
  const stockTableBody = document.getElementById("stockTableBody");
  const supplierCards = document.getElementById("supplierCards");
  const supplierListView = document.getElementById("supplierListView");
  const supplierViewGridBtn = document.getElementById("supplierViewGrid");
  const supplierViewListBtn = document.getElementById("supplierViewList");
  const supplierForm = document.getElementById("supplierForm");
  const supplierEditName = document.getElementById("supplierEditName");
  const supplierEditRows = document.getElementById("supplierEditRows");
  let editingSupplierName = null;
  const assetFormStatus = document.getElementById("assetFormStatus");
  const assetSubmitBtn = document.getElementById("assetSubmitBtn");
  const assetViewGridBtn = document.getElementById("assetViewGrid");
  const assetViewListBtn = document.getElementById("assetViewList");
  const assetListView = document.getElementById("assetListView");
  const assetListBody = document.getElementById("assetListBody");
  const stockTableCard = document.getElementById("stockTableCard");
  const assetsPrevBtn = document.getElementById("assetsPrevBtn");
  const assetsNextBtn = document.getElementById("assetsNextBtn");
  const assetsPageInfo = document.getElementById("assetsPageInfo");


  const ASSETS_PAGE_SIZE = 50;
  let assetsOffset = 0;
  let assetsFetchTimer = null;

  const assetEditForm = document.getElementById("assetEditForm");
  const editName = document.getElementById("editName");
  const editBrand = document.getElementById("editBrand");
  const editCategoryId = document.getElementById("editCategoryId");
  const editProviderId = document.getElementById("editProviderId");
  const editSerial = document.getElementById("editSerial");
  const editAssigned = document.getElementById("editAssigned");
  const editLocation = document.getElementById("editLocation");
  const editStatus = document.getElementById("editStatus");
  const editType = document.getElementById("editType");
  const editWarranty = document.getElementById("editWarranty");
  const editStock = document.getElementById("editStock");
  const editMinStock = document.getElementById("editMinStock");
  const editSupplierName = document.getElementById("editSupplierName");
  const editSupplierPrice = document.getElementById("editSupplierPrice");
  const editSupplierLeadTime = document.getElementById("editSupplierLeadTime");
  let editingAssetId = null;
  let categories = [];
  let providers = [];

  const setInventoryStatus = (message) => {
    if (!inventoryStatus) {
      return;
    }
    inventoryStatus.textContent = message || "";
  };

  window.addEventListener("error", (event) => {
    if (inventoryStatus) {
      inventoryStatus.textContent = `Inventory error: ${event.message || "unknown"}`;
    }
  });

  const token = localStorage.getItem("sigam_token");
  const shortToken = token ? `${token.slice(0, 8)}...` : "missing";
  setInventoryStatus(`Inventory script loaded. API: ${apiBaseUrl || "missing"} | token: ${shortToken}`);

  const normalizeAssets = (list) => {
    return list.map(asset => {
      const normalized = { ...asset };
      if (typeof normalized.stock !== "number") {
        normalized.stock = Number.parseInt(normalized.stock || "0", 10) || 0;
      }
      if (typeof normalized.minStock !== "number") {
        normalized.minStock = Number.parseInt(normalized.minStock || "0", 10) || 0;
      }
      if (!Array.isArray(normalized.suppliers)) {
        normalized.suppliers = [];
      }
      return normalized;
    });
  };

  const normalizeType = (raw) => {
    const value = String(raw || "").toLowerCase();
    if (value.includes("laptop") || value.includes("notebook")) {
      return "laptop";
    }
    if (value.includes("server")) {
      return "server";
    }
    if (value.includes("printer") || value.includes("impresora")) {
      return "printer";
    }
    if (value.includes("monitor")) {
      return "monitor";
    }
    if (value.includes("desktop") || value.includes("pc")) {
      return "desktop";
    }
    if (value.includes("tv") || value.includes("televisor")) {
      return "tv";
    }
    if (value.includes("router")) {
      return "router";
    }
    return "";
  };

  const mapStatus = (estado) => {
    const value = String(estado || "").toLowerCase();
    if (value.includes("manten") || value.includes("vencid")) {
      return "maintenance";
    }
    return "active";
  };

  const normalizeApiAsset = (raw) => {
    const id = raw.id_activo || raw.id || raw.idActivo;
    const locationParts = [raw.sede, raw.piso, raw.sala].filter(Boolean);
    const location = locationParts.join(" - ") || raw.ubicacion || "";
    const supplierName = raw.proveedor || raw.proveedor_nombre || "";
    const typeRaw =
      raw.tipo_activo ||
      raw.tipo_equipo ||
      raw.tipo ||
      raw.categoria ||
      raw.categoria_nombre ||
      raw.modelo ||
      raw.nombre ||
      "";
    const normalizedType = normalizeType(typeRaw) || "desktop";
    return {
      name: raw.modelo || raw.nombre || `Asset ${id}`,
      id: id ? String(id) : "",
      categoryId: raw.id_categoria || raw.categoria_id || raw.idCategoria || "",
      providerId: raw.id_proveedor || raw.proveedor_id || raw.idProveedor || "",
      brand: raw.modelo || raw.marca || "",
      serial: raw.serial || "",
      assigned: raw.asignado_a || raw.usuario || "",
      location,
      status: mapStatus(raw.estado_vida_util || raw.estado || ""),
      type: normalizedType,
      warranty: raw.vida_util ? `${raw.vida_util} months` : raw.estado_vida_util || "",
      stock: Number.parseInt(raw.stock || "0", 10) || 0,
      minStock: Number.parseInt(raw.stock_minimo || "0", 10) || 0,
      suppliers: supplierName
        ? [{ name: supplierName, price: 0, leadTime: 0 }]
        : []
    };
  };

  const handleAssetNavigation = (assetId) => {
    if (!assetId) return;
    const encoded = encodeURIComponent(assetId);
    router.navigateTo(`/asset-history?id=${encoded}`);
  };

  const handleAssetCardClick = (event) => {
    const card = event.target.closest("[data-asset-history-id]");
    if (!card) return;
    if (event.target.closest(".asset-edit")) {
      return;
    }
    handleAssetNavigation(card.dataset.assetHistoryId);
  };

  const handleAssetCardKey = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    handleAssetCardClick(event);
  };

  if (grid) {
    grid.addEventListener("click", handleAssetCardClick);
    grid.addEventListener("keydown", handleAssetCardKey);
  }

  const handleAssetRowClick = (event) => {
    const row = event.target.closest("[data-asset-id]");
    if (!row) return;
    handleAssetNavigation(row.dataset.assetId);
  };

  const handleAssetRowKey = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    handleAssetRowClick(event);
  };

  if (assetListBody) {
    assetListBody.addEventListener("click", handleAssetRowClick);
    assetListBody.addEventListener("keydown", handleAssetRowKey);
  }

  const applyAssetsView = (displayList, referenceList = null) => {
    const normalizedDisplay = normalizeAssets(displayList);
    const normalizedRef = normalizeAssets(referenceList || displayList);
    assets = normalizedDisplay;
    renderAssets(normalizedDisplay);
    renderStockTable(normalizedRef);
    buildLocationOptions(normalizedRef);
    scheduleSupplierRender(normalizedRef);
  };

  const applyAssetsPagination = (list) => {
    if (paginationMode === "client") {
      if (list.length > 0) {
        const lastPageStart = Math.max(0, Math.floor((list.length - 1) / ASSETS_PAGE_SIZE) * ASSETS_PAGE_SIZE);
        assetsOffset = Math.min(assetsOffset, lastPageStart);
      } else {
        assetsOffset = 0;
      }
      const pageItems = list.slice(assetsOffset, assetsOffset + ASSETS_PAGE_SIZE);
      applyAssetsView(pageItems, list);
      updateAssetsPagination(pageItems.length, list.length);
      return;
    }
    applyAssetsView(list);
    updateAssetsPagination(list.length);
  };

  const scheduleSupplierRender = (list) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => renderSupplierCards(list));
    } else {
      setTimeout(() => renderSupplierCards(list), 0);
    }
  };

  const getIdValue = (item, keys) => {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null && item[key] !== "") {
        return item[key];
      }
    }
    return "";
  };

  const getLabelValue = (item, keys) => {
    for (const key of keys) {
      if (item && item[key]) {
        return String(item[key]);
      }
    }
    return "";
  };

  const fillSelect = (select, items, placeholder) => {
    if (!select) {
      return;
    }
    const options = (items || [])
      .map(item => {
        const id = getIdValue(item, ["id_categoria", "id_proveedor", "id", "idCategoria", "idProveedor"]);
        const label = getLabelValue(item, ["nombre", "name", "descripcion", "razon_social", "contacto"]);
        const text = label || (id ? `ID ${id}` : "No name");
        return `<option value="${id}">${text}</option>`;
      })
      .join("");

    select.innerHTML = `<option value="">${placeholder}</option>` + options;
  };

  const getActivos = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query ? `${SIGAM_CONFIG.ACTIVOS_ENDPOINT}?${query}` : SIGAM_CONFIG.ACTIVOS_ENDPOINT;
    const payload = await api.apiRequest(path);
    return normalizeCollection(payload);
  };

  const createActivo = async (body) => {
    return api.apiRequest(SIGAM_CONFIG.ACTIVOS_ENDPOINT, { method: "POST", body });
  };

  const updateActivo = async (assetId, body) => {
    const safeId = encodeURIComponent(assetId);
    return api.apiRequest(`${SIGAM_CONFIG.ACTIVOS_ENDPOINT}/${safeId}`, { method: "PUT", body });
  };

  const getCategorias = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query ? `${SIGAM_CONFIG.CATEGORIAS_ENDPOINT}?${query}` : SIGAM_CONFIG.CATEGORIAS_ENDPOINT;
    const payload = await api.apiRequest(path);
    return normalizeCollection(payload);
  };

  const getProveedores = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query ? `${SIGAM_CONFIG.PROVEEDORES_ENDPOINT}?${query}` : SIGAM_CONFIG.PROVEEDORES_ENDPOINT;
    const payload = await api.apiRequest(path);
    return normalizeCollection(payload);
  };

  const loadCategoriesAndProviders = async () => {
    if (!SIGAM_CONFIG.API_BASE_URL) {
      return;
    }
    try {
      categories = await getCategorias({ limit: 50, offset: 0 });
      fillSelect(document.getElementById("categoryId"), categories, "Select category");
      fillSelect(editCategoryId, categories, "Select category");
    } catch {
      // ignore
    }

    try {
      providers = await getProveedores({ limit: 50, offset: 0 });
      fillSelect(document.getElementById("providerId"), providers, "Select provider");
      fillSelect(editProviderId, providers, "Select provider");
    } catch {
      // ignore
    }
  };

  const buildAssetsQuery = () => {
    const params = {
      limit: ASSETS_PAGE_SIZE,
      offset: assetsOffset
    };
    const searchValue = searchInput ? searchInput.value.trim() : "";
    const statusValue = statusFilter ? statusFilter.value : "all";
    const typeValue = typeFilter ? typeFilter.value : "all";
    const locationValue = locationFilter ? locationFilter.value : "all";

    if (searchValue) {
      params.search = searchValue;
    }
    if (statusValue && statusValue !== "all") {
      params.estado = statusValue;
    }
    if (typeValue && typeValue !== "all") {
      params.tipo = typeValue;
    }
    if (locationValue && locationValue !== "all") {
      params.ubicacion = locationValue;
    }

    return params;
  };

  const scheduleAssetsRefresh = () => {
    if (assetsFetchTimer) {
      clearTimeout(assetsFetchTimer);
    }
    assetsFetchTimer = setTimeout(() => {
      assetsOffset = 0;
      loadAssetsFromApi();
    }, 600);
  };

  const loadAssetsFromApi = async () => {
    if (!SIGAM_CONFIG.API_BASE_URL) {
      setInventoryStatus("API client not ready.");
      assetsAll = [];
      assetsFiltered = [];
      applyAssetsPagination([]);
      return;
    }
    setInventoryStatus("Loading assets...");
    const cached = localStorage.getItem("assets");
    if (cached && assets.length === 0) {
      try {
        const cachedList = JSON.parse(cached);
        assetsAll = normalizeAssets(cachedList || []);
        assetsFiltered = assetsAll;
        paginationMode = assetsAll.length > ASSETS_PAGE_SIZE ? "client" : "server";
        applyAssetsPagination(assetsFiltered);
      } catch {
        // ignore cache parse errors
      }
    }
    try {
      const data = await getActivos(buildAssetsQuery());
      const mapped = (data || []).map(normalizeApiAsset);
      assetsAll = normalizeAssets(mapped);
      assetsFiltered = assetsAll;
      paginationMode = assetsAll.length > ASSETS_PAGE_SIZE ? "client" : "server";
      applyAssetsPagination(assetsFiltered);
      localStorage.setItem("assets", JSON.stringify(assetsAll));
      setInventoryStatus(`Loaded ${assetsAll.length} assets.`);
    } catch (error) {
      assetsAll = [];
      assetsFiltered = [];
      applyAssetsPagination([]);
      if (assetFormStatus) {
        assetFormStatus.textContent = "Could not load assets from the server.";
        assetFormStatus.className = "me-auto small text-danger";
      }
      const statusCode = error && error.status ? error.status : null;
      if (statusCode === 401) {
        setInventoryStatus("Session expired. Please log in again.");
        setTimeout(() => {
          router.navigateTo("/login", { replace: true });
        }, 800);
      } else if (statusCode === 429) {
        setInventoryStatus("Too many requests. Please wait and try again.");
      } else if (statusCode === 500) {
        setInventoryStatus("Server error loading assets.");
      } else {
        const status = statusCode ? ` (${statusCode})` : "";
        setInventoryStatus(`Failed to load assets${status}.`);
      }
      updateAssetsPagination(0);
    }
  };

  const updateAssetsPagination = (count, total = null) => {
    if (assetsPageInfo) {
      const page = Math.floor(assetsOffset / ASSETS_PAGE_SIZE) + 1;
      if (total !== null) {
        const totalPages = Math.max(1, Math.ceil(total / ASSETS_PAGE_SIZE));
        assetsPageInfo.textContent = `Page ${page} of ${totalPages}`;
      } else {
        assetsPageInfo.textContent = `Page ${page}`;
      }
    }
    if (assetsPrevBtn) {
      assetsPrevBtn.disabled = assetsOffset <= 0;
    }
    if (assetsNextBtn) {
      if (total !== null) {
        assetsNextBtn.disabled = assetsOffset + ASSETS_PAGE_SIZE >= total;
      } else {
        assetsNextBtn.disabled = count < ASSETS_PAGE_SIZE;
      }
    }
  };

  const renderAssets = (list) => {
    const cards = [];

    list.forEach(asset => {
      cards.push(renderAssetCard(asset));
    });

    if (grid) {
      grid.innerHTML = cards.join("");
    }
    if (resultCount) {
      const total = assetsFiltered.length || assetsAll.length || assets.length;
      resultCount.innerText = `Showing ${list.length} of ${total} assets`;
    }
    renderAssetList(list);
  };

  const renderAssetList = (list) => {
    if (!assetListBody) {
      return;
    }
    const rows = [];
    list.forEach(asset => {
      const statusBadge = asset.status === "maintenance"
        ? '<span class="badge bg-warning text-dark">Maintenance</span>'
        : '<span class="badge bg-success">Active</span>';
      const statusClass = asset.status === "maintenance" ? "status-warning" : "status-ok";
      rows.push(`
        <tr class="asset-row ${statusClass}" data-asset-id="${asset.id}" tabindex="0" role="button" aria-label="Abrir hoja de vida del activo ${asset.name}">
          <td>${asset.name}</td>
          <td class="text-muted">${asset.type}</td>
          <td class="text-muted">${asset.location}</td>
          <td class="text-end fw-semibold">${asset.stock}</td>
          <td>${statusBadge}</td>
        </tr>
      `);
    });
    assetListBody.innerHTML = rows.join("");
  };

  const setAssetView = (mode) => {
    if (!assetViewGridBtn || !assetViewListBtn || !assetListView || !grid) {
      return;
    }
    const showList = mode === "list";
    assetListView.classList.toggle("d-none", !showList);
    grid.classList.toggle("d-none", showList);
    assetViewGridBtn.classList.toggle("active", !showList);
    assetViewListBtn.classList.toggle("active", showList);
  };

  const renderStockTable = (list) => {
    if (!stockTableBody) {
      return;
    }
    const rows = [];
    const lowStockList = list.filter((asset) => asset.stock < asset.minStock);
    if (!lowStockList.length) {
      stockTableBody.innerHTML = '<tr><td colspan="6" class="text-muted">No low stock alerts.</td></tr>';
      return;
    }

    lowStockList.forEach(asset => {
      const isLow = asset.stock < asset.minStock;
      const statusBadge = isLow
        ? '<span class="badge bg-danger">Below minimum</span>'
        : '<span class="badge bg-success">OK</span>';

      rows.push(`
        <tr class="${isLow ? "table-danger" : ""}">
          <td>${asset.name}</td>
          <td class="text-muted">${asset.type}</td>
          <td class="text-muted">${asset.location}</td>
          <td class="text-end fw-semibold">${asset.stock}</td>
          <td class="text-end text-muted">${asset.minStock}</td>
          <td>${statusBadge}</td>
        </tr>
      `);
    });
    stockTableBody.innerHTML = rows.join("");
  };

  const buildLocationOptions = (list) => {
    if (!locationFilter) {
      return;
    }
    const current = locationFilter.value;
    const locations = Array.from(
      new Set(
        list
          .map(asset => (asset.location || "").trim())
          .filter(location => location.length)
      )
    ).sort((a, b) => a.localeCompare(b));

    locationFilter.innerHTML = '<option value="all">All Locations</option>';
    locations.forEach(location => {
      const option = document.createElement("option");
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });

    if (current && locations.includes(current)) {
      locationFilter.value = current;
    } else {
      locationFilter.value = "all";
    }
  };

  const renderSupplierCards = (list) => {
    if (!supplierCards) {
      return;
    }
    const cards = [];
    if (!list.length) {
      supplierCards.innerHTML = '<div class="text-muted">No suppliers available.</div>';
      if (supplierListView) {
        supplierListView.innerHTML = '<p class="text-muted mb-0">No suppliers available.</p>';
      }
      return;
    }

    const assetBestPrices = {};
    list.forEach(asset => {
      const prices = (asset.suppliers || [])
        .map(s => ({ name: s.name, price: Number.parseInt(s.price || "0", 10) || 0 }))
        .filter(s => s.price > 0);
      if (prices.length) {
        const best = prices.reduce((min, cur) => (cur.price < min.price ? cur : min));
        assetBestPrices[asset.name] = best;
      }
    });

    const suppliers = {};
    list.forEach(asset => {
      (asset.suppliers || []).forEach(supplier => {
        if (!suppliers[supplier.name]) {
          suppliers[supplier.name] = {
            name: supplier.name,
            items: 0,
            totalStock: 0,
            totalPrice: 0,
            leadTimes: [],
            assets: []
          };
        }
        suppliers[supplier.name].items += 1;
        suppliers[supplier.name].totalStock += asset.stock;
        suppliers[supplier.name].totalPrice += supplier.price || 0;
        if (typeof supplier.leadTime === "number") {
          suppliers[supplier.name].leadTimes.push(supplier.leadTime);
        }
        suppliers[supplier.name].assets.push({
          assetName: asset.name,
          price: supplier.price || 0,
          isBest: assetBestPrices[asset.name] &&
            assetBestPrices[asset.name].name === supplier.name
        });
      });
    });

    Object.values(suppliers).forEach(supplier => {
      const avgPrice = supplier.items ? Math.round(supplier.totalPrice / supplier.items) : 0;
      const avgLeadTime = supplier.leadTimes.length
        ? Math.round(supplier.leadTimes.reduce((a, b) => a + b, 0) / supplier.leadTimes.length)
        : 0;

      const sortedAssets = supplier.assets
        .slice()
        .sort((a, b) => (a.price || 0) - (b.price || 0));
      const visibleAssets = sortedAssets.slice(0, 5);
      const extraCount = Math.max(0, sortedAssets.length - visibleAssets.length);

      const assetRows = visibleAssets.map(item => `
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted">${item.assetName}</span>
            <span class="fw-semibold ${item.isBest ? "text-success" : ""}">
              $${item.price}${item.isBest ? " best" : ""}
            </span>
          </div>
        `).join("") + (extraCount
        ? `<div class="text-muted small">+${extraCount} more</div>`
        : "");

      cards.push(`
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h6 class="fw-bold mb-1">${supplier.name}</h6>
                <div class="d-flex gap-2 align-items-center">
                  <span class="badge bg-primary-subtle text-primary border">Supplier</span>
                  ${renderButton({
                    label: "Edit",
                    variant: "outlineDark",
                    className: "btn-sm supplier-edit",
                    attrs: { type: "button", "data-supplier": supplier.name }
                  })}
                </div>
              </div>
              <div class="text-muted small mb-3">Assets supplied: ${supplier.items}</div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Avg Price</span>
                <span class="fw-semibold">$${avgPrice}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Total Stock</span>
                <span class="fw-semibold">${supplier.totalStock}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span class="text-muted">Avg Lead Time</span>
                <span class="fw-semibold">${avgLeadTime} days</span>
              </div>
              <div class="border-top pt-3 mt-3">
                <div class="text-muted small mb-2">Price by asset</div>
                ${assetRows || '<div class="text-muted small">No price data</div>'}
              </div>
            </div>
          </div>
        </div>
      `);
    });

    supplierCards.innerHTML = cards.join("");
    renderSupplierList(suppliers);
  };

  const renderSupplierList = (suppliersMap) => {
    if (!supplierListView) {
      return;
    }
    const suppliers = Object.values(suppliersMap || {});
    if (!suppliers.length) {
      supplierListView.innerHTML = '<p class="text-muted mb-0">No suppliers available.</p>';
      return;
    }
    supplierListView.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm align-middle supplier-table mb-0">
          <thead class="text-muted">
            <tr>
              <th>Supplier</th>
              <th class="text-end">Assets</th>
              <th class="text-end">Avg Price</th>
              <th class="text-end">Total Stock</th>
              <th class="text-end">Avg Lead</th>
              <th>Assets Detail</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.map((supplier) => {
              const avgPrice = supplier.items ? Math.round(supplier.totalPrice / supplier.items) : 0;
              const avgLeadTime = supplier.leadTimes.length
                ? Math.round(supplier.leadTimes.reduce((a, b) => a + b, 0) / supplier.leadTimes.length)
                : 0;
              const items = supplier.assets
                .slice(0, 5)
                .map(item => `${item.assetName} ($${item.price || 0})`)
                .join(", ");
              const extra = supplier.assets.length > 5 ? ` +${supplier.assets.length - 5} more` : "";
              return `
                <tr>
                  <td class="fw-semibold">${supplier.name}</td>
                  <td class="text-end">${supplier.items}</td>
                  <td class="text-end">$${avgPrice}</td>
                  <td class="text-end">${supplier.totalStock}</td>
                  <td class="text-end">${avgLeadTime} days</td>
                  <td class="text-muted">${items}${extra}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const setSupplierView = (mode) => {
    if (!supplierCards || !supplierListView || !supplierViewGridBtn || !supplierViewListBtn) {
      return;
    }
    const showList = mode === "list";
    supplierCards.classList.toggle("d-none", showList);
    supplierListView.classList.toggle("d-none", !showList);
    supplierViewGridBtn.classList.toggle("active", !showList);
    supplierViewListBtn.classList.toggle("active", showList);
  };

  const openSupplierEditor = (supplierName) => {
    if (!supplierEditRows || !supplierEditName || !window.bootstrap) {
      return;
    }
    editingSupplierName = supplierName;
    supplierEditName.value = supplierName;
    supplierEditRows.innerHTML = "";

    assets.forEach(asset => {
      const supplierIndex = (asset.suppliers || []).findIndex(
        supplier => supplier.name === supplierName
      );
      if (supplierIndex === -1) {
        return;
      }
      const supplier = asset.suppliers[supplierIndex];
      supplierEditRows.innerHTML += `
        <tr data-asset-id="${asset.id}" data-supplier-index="${supplierIndex}">
          <td>${asset.name}</td>
          <td class="text-end">
            <input
              class="form-control form-control-sm text-end"
              type="number"
              min="0"
              value="${supplier.price || 0}"
            />
          </td>
          <td class="text-end">
            <input
              class="form-control form-control-sm text-end"
              type="number"
              min="0"
              value="${supplier.leadTime || 0}"
            />
          </td>
        </tr>
      `;
    });

    const modal = new window.bootstrap.Modal(document.getElementById("supplierModal"));
    modal.show();
  };

  const openAssetEditor = (assetId) => {
    const asset = assets.find(item => item.id === assetId);
    if (!asset || !window.bootstrap) {
      return;
    }
    editingAssetId = assetId;

    editName.value = asset.name || "";
    editBrand.value = asset.brand || "";
    if (editCategoryId) {
      editCategoryId.value = asset.categoryId || "";
    }
    if (editProviderId) {
      editProviderId.value = asset.providerId || "";
    }
    editSerial.value = asset.serial || "";
    editAssigned.value = asset.assigned || "";
    editLocation.value = asset.location || "";
    editStatus.value = asset.status || "active";
    editType.value = asset.type || "laptop";
    editWarranty.value = asset.warranty || "";
    editStock.value = asset.stock || 0;
    editMinStock.value = asset.minStock || 0;

    const primarySupplier = (asset.suppliers || [])[0] || {};
    editSupplierName.value = primarySupplier.name || "";
    editSupplierPrice.value = primarySupplier.price || 0;
    editSupplierLeadTime.value = primarySupplier.leadTime || 0;

    const modal = new window.bootstrap.Modal(document.getElementById("assetEditModal"));
    modal.show();
  };

  const filterAssets = () => {
    const search = searchInput ? searchInput.value.toLowerCase() : "";
    const status = statusFilter ? statusFilter.value : "all";
    const type = typeFilter ? typeFilter.value : "all";
    const location = locationFilter ? locationFilter.value : "all";

    const sourceList = Array.isArray(assetsAll) && assetsAll.length ? assetsAll : assets;
    const filtered = sourceList.filter(asset => {
      const matchSearch =
        asset.name.toLowerCase().includes(search) ||
        asset.serial.toLowerCase().includes(search) ||
        asset.brand.toLowerCase().includes(search);

      const matchStatus =
        status === "all" || asset.status === status;

      const matchType =
        type === "all" || asset.type === type;

      const matchLocation =
        location === "all" || (asset.location || "") === location;

      return matchSearch && matchStatus && matchType && matchLocation;
    });

    assetsFiltered = filtered;
    assetsOffset = 0;
    applyAssetsPagination(assetsFiltered);
  };

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filterAssets();
      scheduleAssetsRefresh();
    });
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      filterAssets();
      scheduleAssetsRefresh();
    });
  }
  if (typeFilter) {
    typeFilter.addEventListener("change", () => {
      filterAssets();
      scheduleAssetsRefresh();
    });
  }
  if (locationFilter) {
    locationFilter.addEventListener("change", () => {
      filterAssets();
      scheduleAssetsRefresh();
    });
  }

  if (assetsPrevBtn) {
    assetsPrevBtn.addEventListener("click", () => {
      if (assetsOffset <= 0) {
        return;
      }
      assetsOffset = Math.max(0, assetsOffset - ASSETS_PAGE_SIZE);
      if (paginationMode === "client") {
        applyAssetsPagination(assetsFiltered);
      } else {
        loadAssetsFromApi();
      }
    });
  }

  if (assetsNextBtn) {
    assetsNextBtn.addEventListener("click", () => {
      assetsOffset += ASSETS_PAGE_SIZE;
      if (paginationMode === "client") {
        applyAssetsPagination(assetsFiltered);
      } else {
        loadAssetsFromApi();
      }
    });
  }

  if (assetViewGridBtn) {
    assetViewGridBtn.addEventListener("click", () => setAssetView("grid"));
  }
  if (assetViewListBtn) {
    assetViewListBtn.addEventListener("click", () => setAssetView("list"));
  }
  if (supplierViewGridBtn) {
    supplierViewGridBtn.addEventListener("click", () => setSupplierView("grid"));
  }
  if (supplierViewListBtn) {
    supplierViewListBtn.addEventListener("click", () => setSupplierView("list"));
  }

  loadAssetsFromApi();
  loadCategoriesAndProviders();
  setAssetView("grid");
  setSupplierView("grid");

  const form = document.getElementById("assetForm");
  const nameInput = document.getElementById("name");
  const brandInput = document.getElementById("brand");
  const providerInput = document.getElementById("providerId");
  const serialInput = document.getElementById("serial");
  const assignedInput = document.getElementById("assigned");
  const locationInput = document.getElementById("location");
  const statusInput = document.getElementById("status");
  const typeInput = document.getElementById("type");
  const warrantyInput = document.getElementById("warranty");
  const stockInput = document.getElementById("stock");
  const minStockInput = document.getElementById("minStock");

  const setFieldValidity = (input, isValid, message) => {
    if (!input) {
      return;
    }
    if (isValid) {
      input.classList.remove("is-invalid");
      return;
    }
    input.classList.add("is-invalid");
    if (message) {
      const feedback = input.parentElement.querySelector(".invalid-feedback");
      if (feedback) {
        feedback.textContent = message;
      }
    }
  };

  const setFormStatus = (message, type) => {
    if (!assetFormStatus) {
      return;
    }
    assetFormStatus.textContent = message || "";
    assetFormStatus.className = "me-auto small";
    if (type === "error") {
      assetFormStatus.classList.add("text-danger");
    }
    if (type === "success") {
      assetFormStatus.classList.add("text-success");
    }
    if (type === "loading") {
      assetFormStatus.classList.add("text-muted");
    }
  };

  const setSubmitting = (isSubmitting) => {
    if (!assetSubmitBtn) {
      return;
    }
    assetSubmitBtn.disabled = isSubmitting;
    assetSubmitBtn.textContent = isSubmitting ? "Saving..." : "Save Asset";
  };

  const validateAssetForm = () => {
    let isValid = true;

    const nameValue = nameInput.value.trim();
    const brandValue = brandInput.value.trim();
    const serialValue = serialInput.value.trim();
    const locationValue = locationInput.value.trim();
    const warrantyValue = warrantyInput.value.trim();
    const stockValue = stockInput.value;
    const minStockValue = minStockInput ? minStockInput.value : "0";

    if (nameValue.length < 3) {
      isValid = false;
      setFieldValidity(nameInput, false, "Name is required (min 3 characters).");
    } else {
      setFieldValidity(nameInput, true);
    }

    if (!brandValue) {
      isValid = false;
      setFieldValidity(brandInput, false, "Brand / Model is required.");
    } else {
      setFieldValidity(brandInput, true);
    }

    if (providerInput && !providerInput.value) {
      isValid = false;
      setFieldValidity(providerInput, false, "Provider is required.");
    } else if (providerInput) {
      setFieldValidity(providerInput, true);
    }

    if (!providerInput) {
      isValid = false;
      setFormStatus("Provider is required.", "error");
    }

    if (!serialValue) {
      isValid = false;
      setFieldValidity(serialInput, false, "Serial is required.");
    } else {
      const duplicate = assets.some(asset =>
        (asset.serial || "").trim().toLowerCase() === serialValue.toLowerCase()
      );
      if (duplicate) {
        isValid = false;
        setFieldValidity(serialInput, false, "Serial must be unique.");
      } else {
        setFieldValidity(serialInput, true);
      }
    }

    if (!locationValue) {
      isValid = false;
      setFieldValidity(locationInput, false, "Location is required.");
    } else {
      setFieldValidity(locationInput, true);
    }

    if (!statusInput.value) {
      isValid = false;
      setFieldValidity(statusInput, false, "Status is required.");
    } else {
      setFieldValidity(statusInput, true);
    }

    if (!typeInput.value) {
      isValid = false;
      setFieldValidity(typeInput, false, "Type is required.");
    } else {
      setFieldValidity(typeInput, true);
    }

    if (!warrantyValue) {
      isValid = false;
      setFieldValidity(warrantyInput, false, "Warranty is required.");
    } else {
      const match = warrantyValue.match(/\d+/);
      if (!match) {
        isValid = false;
        setFieldValidity(warrantyInput, false, "Warranty must include months (e.g., 24).");
      } else {
        setFieldValidity(warrantyInput, true);
      }
    }

    const stockNumber = Number.parseInt(stockValue || "0", 10);
    if (!Number.isFinite(stockNumber) || stockNumber < 0) {
      isValid = false;
      setFieldValidity(stockInput, false, "Stock must be 0 or greater.");
    } else {
      setFieldValidity(stockInput, true);
    }

    if (minStockInput) {
      const minStockNumber = Number.parseInt(minStockValue || "0", 10);
      if (!Number.isFinite(minStockNumber) || minStockNumber < 0) {
        isValid = false;
        setFieldValidity(minStockInput, false, "Minimum Stock must be 0 or greater.");
      } else if (Number.isFinite(stockNumber) && minStockNumber > stockNumber) {
        isValid = false;
        setFieldValidity(minStockInput, false, "Minimum Stock cannot exceed Stock.");
      } else {
        setFieldValidity(minStockInput, true);
      }
    }

    if (form) {
      form.classList.add("was-validated");
    }

    return isValid;
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setFormStatus("", "loading");

      if (!validateAssetForm()) {
        setFormStatus("Please fix the highlighted fields.", "error");
        return;
      }

      setSubmitting(true);

      if (!SIGAM_CONFIG.API_BASE_URL) {
        setFormStatus("API no disponible para crear activos.", "error");
        setSubmitting(false);
        return;
      }

      const locationValue = locationInput.value.trim();
      const locationParts = locationValue
        .split("-")
        .map(part => part.trim())
        .filter(Boolean);

      const sede = locationParts[0] || locationValue;
      const piso = locationParts[1] || "";
      const sala = locationParts[2] || (locationParts.length > 1 ? locationParts.slice(1).join(" - ") : "");

      const warrantyRaw = warrantyInput.value.trim();
      const warrantyMatch = warrantyRaw.match(/\d+/);
      const vidaUtil = warrantyMatch ? Number.parseInt(warrantyMatch[0], 10) : null;
      if (!vidaUtil) {
        setFormStatus("Required fields: vida_util", "error");
        setSubmitting(false);
        return;
      }

      const categoryValue = categories.length
        ? (categories[0].id_categoria || categories[0].id || categories[0].idCategoria || "")
        : "";
      const providerValue = providerInput ? providerInput.value : "";

      if (!categoryValue) {
        setFormStatus("Category is required in the system.", "error");
        setSubmitting(false);
        return;
      }

      const payload = {
        id_categoria: Number(categoryValue) || categoryValue,
        id_proveedor: Number(providerValue) || providerValue,
        serial: serialInput.value.trim(),
        modelo: brandInput.value.trim() || nameInput.value.trim(),
        fecha_compra: new Date().toISOString(),
        vida_util: vidaUtil,
        nivel_criticidad: "Media",
        estado_vida_util: statusInput.value === "maintenance" ? "En mantenimiento" : "Vigente",
        sede,
        piso,
        sala,
        proveedor: undefined
      };

      try {
        await createActivo(payload);
        setFormStatus("Asset saved successfully.", "success");
        if (stockTableCard) {
          stockTableCard.classList.add("stock-flash");
          setTimeout(() => stockTableCard.classList.remove("stock-flash"), 900);
        }
        await loadAssetsFromApi();

        form.reset();
        form.classList.remove("was-validated");
        const modal = window.bootstrap ? window.bootstrap.Modal.getInstance(document.getElementById("assetModal")) : null;
        if (modal) {
          modal.hide();
        }
      } catch (error) {
        const message = error && error.message
          ? error.message
          : "Could not save the asset on the server.";
        setFormStatus(message, "error");
      } finally {
        setSubmitting(false);
      }
    });
  }

  if (supplierCards) {
    supplierCards.addEventListener("click", (event) => {
      const button = event.target.closest(".supplier-edit");
      if (!button) {
        return;
      }
      openSupplierEditor(button.dataset.supplier);
    });
  }

  if (grid) {
    grid.addEventListener("click", (event) => {
      const button = event.target.closest(".asset-edit");
      if (!button) {
        return;
      }
      openAssetEditor(button.dataset.assetId);
    });
  }

  if (supplierForm) {
    supplierForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!editingSupplierName) {
        return;
      }
      const newName = supplierEditName.value.trim() || editingSupplierName;

      const rows = supplierEditRows.querySelectorAll("tr");
      rows.forEach(row => {
        const assetId = row.dataset.assetId;
        const supplierIndex = Number.parseInt(row.dataset.supplierIndex, 10);
        const inputs = row.querySelectorAll("input");
        const priceValue = Number.parseInt(inputs[0].value || "0", 10) || 0;
        const leadValue = Number.parseInt(inputs[1].value || "0", 10) || 0;

        const asset = assets.find(item => item.id === assetId);
        if (!asset || !asset.suppliers || !asset.suppliers[supplierIndex]) {
          return;
        }
        asset.suppliers[supplierIndex].price = priceValue;
        asset.suppliers[supplierIndex].leadTime = leadValue;
      });

      if (newName !== editingSupplierName) {
        assets.forEach(asset => {
          (asset.suppliers || []).forEach(supplier => {
            if (supplier.name === editingSupplierName) {
              supplier.name = newName;
            }
          });
        });
      }

      localStorage.setItem("assets", JSON.stringify(assets));
      renderAssets(assets);
      renderStockTable(assets);
      renderSupplierCards(assets);
      buildLocationOptions(assets);

      const modal = window.bootstrap ? window.bootstrap.Modal.getInstance(
        document.getElementById("supplierModal")
      ) : null;
      if (modal) {
        modal.hide();
      }
      editingSupplierName = null;
    });
  }

  if (assetEditForm) {
    assetEditForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const asset = assets.find(item => item.id === editingAssetId);
      if (!asset) {
        return;
      }

      asset.name = editName.value;
      asset.brand = editBrand.value;
      if (editCategoryId) {
        asset.categoryId = editCategoryId.value;
      }
      if (editProviderId) {
        asset.providerId = editProviderId.value;
      }
      asset.serial = editSerial.value;
      asset.assigned = editAssigned.value;
      asset.location = editLocation.value;
      asset.status = editStatus.value;
      asset.type = editType.value;
      asset.warranty = editWarranty.value;
      asset.stock = Number.parseInt(editStock.value || "0", 10) || 0;
      asset.minStock = Number.parseInt(editMinStock.value || "0", 10) || 0;

      const supplierNameValue = editSupplierName.value.trim();
      const supplierPriceValue = Number.parseInt(editSupplierPrice.value || "0", 10) || 0;
      const supplierLeadValue = Number.parseInt(editSupplierLeadTime.value || "0", 10) || 0;

      if (!Array.isArray(asset.suppliers)) {
        asset.suppliers = [];
      }
      if (asset.suppliers.length === 0) {
        if (supplierNameValue) {
          asset.suppliers.push({
            name: supplierNameValue,
            price: supplierPriceValue,
            leadTime: supplierLeadValue
          });
        }
      } else {
        asset.suppliers[0].name = supplierNameValue || asset.suppliers[0].name;
        asset.suppliers[0].price = supplierPriceValue;
        asset.suppliers[0].leadTime = supplierLeadValue;
      }

      const payload = {
        id_categoria: asset.categoryId,
        id_proveedor: asset.providerId,
        serial: asset.serial,
        modelo: asset.brand || asset.name,
        vida_util: Number.parseInt((asset.warranty || "").match(/\d+/)?.[0] || "0", 10) || undefined,
        estado_vida_util: asset.status === "maintenance" ? "En mantenimiento" : "Vigente",
        sede: asset.location
      };

      if (asset.id) {
        try {
          await updateActivo(asset.id, payload);
        } catch {
          // keep local update if API fails
        }
      }

      localStorage.setItem("assets", JSON.stringify(assets));
      renderAssets(assets);
      renderStockTable(assets);
      renderSupplierCards(assets);

      const modal = window.bootstrap ? window.bootstrap.Modal.getInstance(
        document.getElementById("assetEditModal")
      ) : null;
      if (modal) {
        modal.hide();
      }
      editingAssetId = null;
    });
  }
};

export const InventoryPage = {
  render,
  init,
  meta: {
    bodyClass: "bg-light page-inventory",
    roles: ROLE_ALLOWLIST
  }
};
