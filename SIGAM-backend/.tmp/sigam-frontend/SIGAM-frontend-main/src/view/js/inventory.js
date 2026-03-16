// load the assets array from browser storage; if nothing is stored yet, fall back
// to a hard‑coded default list. using `let` because we will reassign when pushing new
// assets later. this ensures persistence across page reloads.
const api = window.SIGAM_API
let assets = []


// grab references to important DOM elements that we will update/interact with
const grid = document.getElementById("assetGrid")
const searchInput = document.getElementById("searchInput")
const statusFilter = document.getElementById("statusFilter")
const typeFilter = document.getElementById("typeFilter")
const locationFilter = document.getElementById("locationFilter")
const resultCount = document.getElementById("resultCount")
const stockTableBody = document.getElementById("stockTableBody")
const supplierCards = document.getElementById("supplierCards")
const supplierForm = document.getElementById("supplierForm")
const supplierEditName = document.getElementById("supplierEditName")
const supplierEditRows = document.getElementById("supplierEditRows")
let editingSupplierName = null
const assetFormStatus = document.getElementById("assetFormStatus")
const assetSubmitBtn = document.getElementById("assetSubmitBtn")

const assetEditForm = document.getElementById("assetEditForm")
const editName = document.getElementById("editName")
const editBrand = document.getElementById("editBrand")
const editSerial = document.getElementById("editSerial")
const editAssigned = document.getElementById("editAssigned")
const editLocation = document.getElementById("editLocation")
const editStatus = document.getElementById("editStatus")
const editType = document.getElementById("editType")
const editWarranty = document.getElementById("editWarranty")
const editStock = document.getElementById("editStock")
const editMinStock = document.getElementById("editMinStock")
const editSupplierName = document.getElementById("editSupplierName")
const editSupplierPrice = document.getElementById("editSupplierPrice")
const editSupplierLeadTime = document.getElementById("editSupplierLeadTime")
let editingAssetId = null

function normalizeAssets(list) {
    return list.map(asset => {
        const normalized = { ...asset }
        if (typeof normalized.stock !== "number") {
            normalized.stock = Number.parseInt(normalized.stock || "0", 10) || 0
        }
        if (typeof normalized.minStock !== "number") {
            normalized.minStock = Number.parseInt(normalized.minStock || "0", 10) || 0
        }
        if (!Array.isArray(normalized.suppliers)) {
            normalized.suppliers = []
        }
        return normalized
    })
}

function guessType(modelo) {
    const value = String(modelo || "").toLowerCase()
    if (value.includes("laptop") || value.includes("notebook")) {
        return "laptop"
    }
    if (value.includes("server")) {
        return "server"
    }
    if (value.includes("printer") || value.includes("impresora")) {
        return "printer"
    }
    if (value.includes("monitor")) {
        return "monitor"
    }
    if (value.includes("desktop") || value.includes("pc")) {
        return "desktop"
    }
    return "desktop"
}

function mapStatus(estado) {
    const value = String(estado || "").toLowerCase()
    if (value.includes("manten") || value.includes("vencid")) {
        return "maintenance"
    }
    return "active"
}

function normalizeApiAsset(raw) {
    const id = raw.id_activo || raw.id || raw.idActivo
    const locationParts = [raw.sede, raw.piso, raw.sala].filter(Boolean)
    const location = locationParts.join(" - ") || raw.ubicacion || ""
    const supplierName = raw.proveedor || raw.proveedor_nombre || ""
    return {
        name: raw.modelo || raw.nombre || `Activo ${id}`,
        id: id ? String(id) : "",
        brand: raw.modelo || raw.marca || "",
        serial: raw.serial || "",
        assigned: raw.asignado_a || raw.usuario || "",
        location,
        status: mapStatus(raw.estado_vida_util || raw.estado || ""),
        type: guessType(raw.modelo || raw.nombre || ""),
        warranty: raw.vida_util ? `${raw.vida_util} meses` : raw.estado_vida_util || "",
        stock: Number.parseInt(raw.stock || "0", 10) || 0,
        minStock: Number.parseInt(raw.stock_minimo || "0", 10) || 0,
        suppliers: supplierName
            ? [{ name: supplierName, price: 0, leadTime: 0 }]
            : []
    }
}

function hydrateAssets(list) {
    assets = normalizeAssets(list)
    renderAssets(assets)
    renderStockTable(assets)
    renderSupplierCards(assets)
    buildLocationOptions(assets)
}

async function loadAssetsFromApi() {
    if (!api || !api.getActivos) {
        hydrateAssets([])
        return
    }
    try {
        const data = await api.getActivos()
        const mapped = (data || []).map(normalizeApiAsset)
        hydrateAssets(mapped)
    } catch (error) {
        hydrateAssets([])
        if (assetFormStatus) {
            assetFormStatus.textContent = "No se pudieron cargar activos del servidor."
            assetFormStatus.className = "me-auto small text-danger"
        }
    }
}


// renderAssets builds the grid of cards from a given list of asset objects.
// it empties the container then appends a bootstrap card for each asset, also
// updating the counter showing how many assets are currently visible vs total.
function renderAssets(list) {

    grid.innerHTML = ""

    list.forEach(asset => {

        let badge = "bg-success"

        if (asset.status === "maintenance") {
            badge = "bg-warning text-dark"
        }

        grid.innerHTML += `

<div class="col-md-4">

<div class="card shadow-sm h-100">

<div class="card-body">

<div class="d-flex justify-content-between align-items-start">
<h5 class="fw-bold">${asset.name}</h5>
<button
  class="btn btn-sm btn-outline-dark asset-edit"
  type="button"
  data-asset-id="${asset.id}"
>
  Edit
</button>
</div>

<small class="text-muted">${asset.id}</small>

<hr>

<p><strong>Brand / Model</strong><br>${asset.brand}</p>

<p><strong>Serial</strong><br>${asset.serial}</p>

<p><strong>Assigned To</strong><br>${asset.assigned}</p>

<p><strong>Location</strong><br>${asset.location}</p>

<div class="d-flex justify-content-between">

<span class="badge ${badge}">
${asset.status}
</span>

<small class="text-danger">
Warranty ${asset.warranty}
</small>

</div>

</div>

</div>

</div>

`

    })

    resultCount.innerText = `Showing ${list.length} of ${assets.length} assets`

}

function renderStockTable(list) {
    if (!stockTableBody) {
        return
    }
    stockTableBody.innerHTML = ""

    list.forEach(asset => {
        const isLow = asset.stock < asset.minStock
        const statusBadge = isLow
            ? '<span class="badge bg-danger">Below minimum</span>'
            : '<span class="badge bg-success">OK</span>'

        stockTableBody.innerHTML += `
          <tr class="${isLow ? "table-danger" : ""}">
            <td>${asset.name}</td>
            <td class="text-muted">${asset.type}</td>
            <td class="text-muted">${asset.location}</td>
            <td class="text-end fw-semibold">${asset.stock}</td>
            <td class="text-end text-muted">${asset.minStock}</td>
            <td>${statusBadge}</td>
          </tr>
        `
    })
}

function buildLocationOptions(list) {
    if (!locationFilter) {
        return
    }
    const current = locationFilter.value
    const locations = Array.from(
        new Set(
            list
                .map(asset => (asset.location || "").trim())
                .filter(location => location.length)
        )
    ).sort((a, b) => a.localeCompare(b))

    locationFilter.innerHTML = '<option value="all">All Locations</option>'
    locations.forEach(location => {
        const option = document.createElement("option")
        option.value = location
        option.textContent = location
        locationFilter.appendChild(option)
    })

    if (current && locations.includes(current)) {
        locationFilter.value = current
    } else {
        locationFilter.value = "all"
    }
}

function renderSupplierCards(list) {
    if (!supplierCards) {
        return
    }
    supplierCards.innerHTML = ""

    const assetBestPrices = {}
    list.forEach(asset => {
        const prices = (asset.suppliers || [])
            .map(s => ({ name: s.name, price: Number.parseInt(s.price || "0", 10) || 0 }))
            .filter(s => s.price > 0)
        if (prices.length) {
            const best = prices.reduce((min, cur) => (cur.price < min.price ? cur : min))
            assetBestPrices[asset.name] = best
        }
    })

    const suppliers = {}
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
                }
            }
            suppliers[supplier.name].items += 1
            suppliers[supplier.name].totalStock += asset.stock
            suppliers[supplier.name].totalPrice += supplier.price || 0
            if (typeof supplier.leadTime === "number") {
                suppliers[supplier.name].leadTimes.push(supplier.leadTime)
            }
            suppliers[supplier.name].assets.push({
                assetName: asset.name,
                price: supplier.price || 0,
                isBest: assetBestPrices[asset.name] &&
                    assetBestPrices[asset.name].name === supplier.name
            })
        })
    })

    Object.values(suppliers).forEach(supplier => {
        const avgPrice = supplier.items ? Math.round(supplier.totalPrice / supplier.items) : 0
        const avgLeadTime = supplier.leadTimes.length
            ? Math.round(supplier.leadTimes.reduce((a, b) => a + b, 0) / supplier.leadTimes.length)
            : 0

        const assetRows = supplier.assets
            .slice()
            .sort((a, b) => (a.price || 0) - (b.price || 0))
            .map(item => `
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted">${item.assetName}</span>
            <span class="fw-semibold ${item.isBest ? "text-success" : ""}">
              $${item.price}${item.isBest ? " best" : ""}
            </span>
          </div>
        `).join("")

        supplierCards.innerHTML += `
          <div class="col-md-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <h6 class="fw-bold mb-1">${supplier.name}</h6>
                  <div class="d-flex gap-2 align-items-center">
                    <span class="badge bg-primary-subtle text-primary border">Supplier</span>
                    <button
                      class="btn btn-sm btn-outline-dark supplier-edit"
                      type="button"
                      data-supplier="${supplier.name}"
                    >
                      Edit
                    </button>
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
        `
    })
}

function openSupplierEditor(supplierName) {
    if (!supplierEditRows || !supplierEditName) {
        return
    }
    editingSupplierName = supplierName
    supplierEditName.value = supplierName
    supplierEditRows.innerHTML = ""

    assets.forEach(asset => {
        const supplierIndex = (asset.suppliers || []).findIndex(
            supplier => supplier.name === supplierName
        )
        if (supplierIndex === -1) {
            return
        }
        const supplier = asset.suppliers[supplierIndex]
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
        `
    })

    const modal = new bootstrap.Modal(document.getElementById("supplierModal"))
    modal.show()
}

function openAssetEditor(assetId) {
    const asset = assets.find(item => item.id === assetId)
    if (!asset) {
        return
    }
    editingAssetId = assetId

    editName.value = asset.name || ""
    editBrand.value = asset.brand || ""
    editSerial.value = asset.serial || ""
    editAssigned.value = asset.assigned || ""
    editLocation.value = asset.location || ""
    editStatus.value = asset.status || "active"
    editType.value = asset.type || "laptop"
    editWarranty.value = asset.warranty || ""
    editStock.value = asset.stock || 0
    editMinStock.value = asset.minStock || 0

    const primarySupplier = (asset.suppliers || [])[0] || {}
    editSupplierName.value = primarySupplier.name || ""
    editSupplierPrice.value = primarySupplier.price || 0
    editSupplierLeadTime.value = primarySupplier.leadTime || 0

    const modal = new bootstrap.Modal(document.getElementById("assetEditModal"))
    modal.show()
}

// filterAssets reads the search and filter inputs, applies them to the global
// `assets` array, and calls renderAssets with the filtered results.
function filterAssets() {

    const search = searchInput.value.toLowerCase()
    const status = statusFilter.value
    const type = typeFilter.value
    const location = locationFilter ? locationFilter.value : "all"

    let filtered = assets.filter(asset => {

        const matchSearch =
            asset.name.toLowerCase().includes(search) ||
            asset.serial.toLowerCase().includes(search) ||
            asset.brand.toLowerCase().includes(search)

        const matchStatus =
            status === "all" || asset.status === status

        const matchType =
            type === "all" || asset.type === type

        const matchLocation =
            location === "all" || (asset.location || "") === location

        return matchSearch && matchStatus && matchType && matchLocation

    })

    renderAssets(filtered)
    renderStockTable(filtered)
    renderSupplierCards(filtered)

}

// wire up input events so that the list refreshes whenever the user types or
// changes a filter dropdown.
searchInput.addEventListener("input", filterAssets)
statusFilter.addEventListener("change", filterAssets)
typeFilter.addEventListener("change", filterAssets)
if (locationFilter) {
    locationFilter.addEventListener("change", filterAssets)
}

// initial load from API
loadAssetsFromApi()



// wait for the DOM to finish loading before accessing form fields, then
// set up the submission handler for adding new assets.
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("assetForm")
    const nameInput = document.getElementById("name")
    const brandInput = document.getElementById("brand")
    const serialInput = document.getElementById("serial")
    const assignedInput = document.getElementById("assigned")
    const locationInput = document.getElementById("location")
    const statusInput = document.getElementById("status")
    const typeInput = document.getElementById("type")
    const warrantyInput = document.getElementById("warranty")
    const stockInput = document.getElementById("stock")
    const minStockInput = document.getElementById("minStock")
    const supplierNameInput = document.getElementById("supplierName")
    const supplierPriceInput = document.getElementById("supplierPrice")
    const supplierLeadInput = document.getElementById("supplierLeadTime")

    function setFieldValidity(input, isValid, message) {
        if (!input) {
            return
        }
        if (isValid) {
            input.classList.remove("is-invalid")
            return
        }
        input.classList.add("is-invalid")
        if (message) {
            const feedback = input.parentElement.querySelector(".invalid-feedback")
            if (feedback) {
                feedback.textContent = message
            }
        }
    }

    function setFormStatus(message, type) {
        if (!assetFormStatus) {
            return
        }
        assetFormStatus.textContent = message || ""
        assetFormStatus.className = "me-auto small"
        if (type === "error") {
            assetFormStatus.classList.add("text-danger")
        }
        if (type === "success") {
            assetFormStatus.classList.add("text-success")
        }
        if (type === "loading") {
            assetFormStatus.classList.add("text-muted")
        }
    }

    function setSubmitting(isSubmitting) {
        if (!assetSubmitBtn) {
            return
        }
        assetSubmitBtn.disabled = isSubmitting
        assetSubmitBtn.textContent = isSubmitting ? "Saving..." : "Save Asset"
    }

    function validateAssetForm() {
        let isValid = true

        const nameValue = nameInput.value.trim()
        const brandValue = brandInput.value.trim()
        const serialValue = serialInput.value.trim()
        const locationValue = locationInput.value.trim()
        const warrantyValue = warrantyInput.value.trim()
        const stockValue = stockInput.value
        const minStockValue = minStockInput.value

        if (nameValue.length < 3) {
            isValid = false
            setFieldValidity(nameInput, false, "Name is required (min 3 characters).")
        } else {
            setFieldValidity(nameInput, true)
        }

        if (!brandValue) {
            isValid = false
            setFieldValidity(brandInput, false, "Brand / Model is required.")
        } else {
            setFieldValidity(brandInput, true)
        }

        if (!serialValue) {
            isValid = false
            setFieldValidity(serialInput, false, "Serial is required.")
        } else {
            const duplicate = assets.some(asset =>
                (asset.serial || "").trim().toLowerCase() === serialValue.toLowerCase()
            )
            if (duplicate) {
                isValid = false
                setFieldValidity(serialInput, false, "Serial must be unique.")
            } else {
                setFieldValidity(serialInput, true)
            }
        }

        if (!locationValue) {
            isValid = false
            setFieldValidity(locationInput, false, "Location is required.")
        } else {
            setFieldValidity(locationInput, true)
        }

        if (!statusInput.value) {
            isValid = false
            setFieldValidity(statusInput, false, "Status is required.")
        } else {
            setFieldValidity(statusInput, true)
        }

        if (!typeInput.value) {
            isValid = false
            setFieldValidity(typeInput, false, "Type is required.")
        } else {
            setFieldValidity(typeInput, true)
        }

        if (!warrantyValue) {
            isValid = false
            setFieldValidity(warrantyInput, false, "Warranty is required.")
        } else {
            const match = warrantyValue.match(/\d+/)
            if (!match) {
                isValid = false
                setFieldValidity(warrantyInput, false, "Warranty must include months (e.g., 24).")
            } else {
                setFieldValidity(warrantyInput, true)
            }
        }

        const stockNumber = Number.parseInt(stockValue || "0", 10)
        if (!Number.isFinite(stockNumber) || stockNumber < 0) {
            isValid = false
            setFieldValidity(stockInput, false, "Stock must be 0 or greater.")
        } else {
            setFieldValidity(stockInput, true)
        }

        const minStockNumber = Number.parseInt(minStockValue || "0", 10)
        if (!Number.isFinite(minStockNumber) || minStockNumber < 0) {
            isValid = false
            setFieldValidity(minStockInput, false, "Minimum Stock must be 0 or greater.")
        } else if (Number.isFinite(stockNumber) && minStockNumber > stockNumber) {
            isValid = false
            setFieldValidity(minStockInput, false, "Minimum Stock cannot exceed Stock.")
        } else {
            setFieldValidity(minStockInput, true)
        }

        const supplierNameValue = supplierNameInput.value.trim()
        const supplierPriceValue = supplierPriceInput.value.trim()
        const supplierLeadValue = supplierLeadInput.value.trim()
        const supplierTouched = Boolean(
            supplierNameValue || supplierPriceValue || supplierLeadValue
        )

        if (supplierTouched) {
            if (!supplierNameValue) {
                isValid = false
                setFieldValidity(
                    supplierNameInput,
                    false,
                    "Supplier name is required when supplier data is provided."
                )
            } else {
                setFieldValidity(supplierNameInput, true)
            }

            const supplierPriceNumber = Number.parseInt(supplierPriceValue || "0", 10)
            if (!supplierPriceValue || !Number.isFinite(supplierPriceNumber) || supplierPriceNumber < 0) {
                isValid = false
                setFieldValidity(
                    supplierPriceInput,
                    false,
                    "Supplier price must be 0 or greater."
                )
            } else {
                setFieldValidity(supplierPriceInput, true)
            }

            if (supplierLeadValue) {
                const supplierLeadNumber = Number.parseInt(supplierLeadValue, 10)
                if (!Number.isFinite(supplierLeadNumber) || supplierLeadNumber < 0) {
                    isValid = false
                    setFieldValidity(
                        supplierLeadInput,
                        false,
                        "Lead time must be 0 or greater."
                    )
                } else {
                    setFieldValidity(supplierLeadInput, true)
                }
            } else {
                setFieldValidity(supplierLeadInput, true)
            }
        } else {
            setFieldValidity(supplierNameInput, true)
            setFieldValidity(supplierPriceInput, true)
            setFieldValidity(supplierLeadInput, true)
        }

        form.classList.add("was-validated")

        return isValid
    }

    // when the new-asset form is submitted, build an object out of the inputs,
    // push it to the assets array, save the updated array to storage, re-render
    // the grid and reset/close the modal.
    form.addEventListener("submit", async function (e) {

        e.preventDefault()
        setFormStatus("", "loading")

        if (!validateAssetForm()) {
            setFormStatus("Please fix the highlighted fields.", "error")
            return
        }

        setSubmitting(true)

        if (!api || !api.createActivo) {
            setFormStatus("API no disponible para crear activos.", "error")
            setSubmitting(false)
            return
        }

        const locationValue = locationInput.value.trim()
        const locationParts = locationValue
            .split("-")
            .map(part => part.trim())
            .filter(Boolean)

        const sede = locationParts[0] || locationValue
        const piso = locationParts[1] || ""
        const sala = locationParts[2] || (locationParts.length > 1 ? locationParts.slice(1).join(" - ") : "")

        const warrantyRaw = warrantyInput.value.trim()
        const warrantyMatch = warrantyRaw.match(/\d+/)
        const vidaUtil = warrantyMatch ? Number.parseInt(warrantyMatch[0], 10) : null
        if (!vidaUtil) {
            setFormStatus("Campos requeridos: vida_util", "error")
            setSubmitting(false)
            return
        }

        const payload = {
            serial: serialInput.value.trim(),
            modelo: brandInput.value.trim() || nameInput.value.trim(),
            fecha_compra: new Date().toISOString(),
            vida_util: vidaUtil,
            nivel_criticidad: "Media",
            estado_vida_util: statusInput.value === "maintenance" ? "En mantenimiento" : "Vigente",
            sede,
            piso,
            sala,
            proveedor: supplierNameInput.value.trim() || undefined
        }

        try {
            await api.createActivo(payload)
            setFormStatus("Asset saved successfully.", "success")
            await loadAssetsFromApi()

            form.reset()
            form.classList.remove("was-validated")
            const modal = bootstrap.Modal.getInstance(document.getElementById("assetModal"))
            if (modal) {
                modal.hide()
            }
        } catch (error) {
            const message = error && error.message
                ? error.message
                : "No se pudo guardar el activo en el servidor."
            setFormStatus(message, "error")
        } finally {
            setSubmitting(false)
        }

    })

})


if (supplierCards) {
    supplierCards.addEventListener("click", function (event) {
        const button = event.target.closest(".supplier-edit")
        if (!button) {
            return
        }
        openSupplierEditor(button.dataset.supplier)
    })
}

if (grid) {
    grid.addEventListener("click", function (event) {
        const button = event.target.closest(".asset-edit")
        if (!button) {
            return
        }
        openAssetEditor(button.dataset.assetId)
    })
}

if (supplierForm) {
    supplierForm.addEventListener("submit", function (event) {
        event.preventDefault()
        if (!editingSupplierName) {
            return
        }
        const newName = supplierEditName.value.trim() || editingSupplierName

        const rows = supplierEditRows.querySelectorAll("tr")
        rows.forEach(row => {
            const assetId = row.dataset.assetId
            const supplierIndex = Number.parseInt(row.dataset.supplierIndex, 10)
            const inputs = row.querySelectorAll("input")
            const priceValue = Number.parseInt(inputs[0].value || "0", 10) || 0
            const leadValue = Number.parseInt(inputs[1].value || "0", 10) || 0

            const asset = assets.find(item => item.id === assetId)
            if (!asset || !asset.suppliers || !asset.suppliers[supplierIndex]) {
                return
            }
            asset.suppliers[supplierIndex].price = priceValue
            asset.suppliers[supplierIndex].leadTime = leadValue
        })

        if (newName !== editingSupplierName) {
            assets.forEach(asset => {
                (asset.suppliers || []).forEach(supplier => {
                    if (supplier.name === editingSupplierName) {
                        supplier.name = newName
                    }
                })
            })
        }

        localStorage.setItem("assets", JSON.stringify(assets))
        renderAssets(assets)
        renderStockTable(assets)
        renderSupplierCards(assets)
        buildLocationOptions(assets)

        const modal = bootstrap.Modal.getInstance(
            document.getElementById("supplierModal")
        )
        if (modal) {
            modal.hide()
        }
        editingSupplierName = null
    })
}

if (assetEditForm) {
    assetEditForm.addEventListener("submit", function (event) {
        event.preventDefault()
        const asset = assets.find(item => item.id === editingAssetId)
        if (!asset) {
            return
        }

        asset.name = editName.value
        asset.brand = editBrand.value
        asset.serial = editSerial.value
        asset.assigned = editAssigned.value
        asset.location = editLocation.value
        asset.status = editStatus.value
        asset.type = editType.value
        asset.warranty = editWarranty.value
        asset.stock = Number.parseInt(editStock.value || "0", 10) || 0
        asset.minStock = Number.parseInt(editMinStock.value || "0", 10) || 0

        const supplierNameValue = editSupplierName.value.trim()
        const supplierPriceValue = Number.parseInt(editSupplierPrice.value || "0", 10) || 0
        const supplierLeadValue = Number.parseInt(editSupplierLeadTime.value || "0", 10) || 0

        if (!Array.isArray(asset.suppliers)) {
            asset.suppliers = []
        }
        if (asset.suppliers.length === 0) {
            if (supplierNameValue) {
                asset.suppliers.push({
                    name: supplierNameValue,
                    price: supplierPriceValue,
                    leadTime: supplierLeadValue
                })
            }
        } else {
            asset.suppliers[0].name = supplierNameValue || asset.suppliers[0].name
            asset.suppliers[0].price = supplierPriceValue
            asset.suppliers[0].leadTime = supplierLeadValue
        }

        localStorage.setItem("assets", JSON.stringify(assets))
        renderAssets(assets)
        renderStockTable(assets)
        renderSupplierCards(assets)

        const modal = bootstrap.Modal.getInstance(
            document.getElementById("assetEditModal")
        )
        if (modal) {
            modal.hide()
        }
        editingAssetId = null
    })
}
