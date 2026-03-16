import fs from "fs";
import path from "path";
import { describe, it, expect, beforeEach, vi } from "vitest";

const waitFor = async (check, { timeout = 500, interval = 20 } = {}) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (check()) return;
    if (Date.now() - start >= timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise((r) => setTimeout(r, interval));
  }
};

function loadScript(filePath) {
  const script = fs.readFileSync(filePath, "utf8");
  window.eval(script);
}

function setupDom() {
  document.body.innerHTML = `
    <div id="app-navbar"></div>
    <div id="ticketModal" style="display:none"></div>
    <button id="newTicketBtn"></button>
    <span class="close"></span>
    <form id="ticketForm">
      <input id="title" />
      <div id="titleError"></div>
      <textarea id="description"></textarea>
      <div id="descriptionError"></div>
      <input id="device" list="deviceList" />
      <datalist id="deviceList"></datalist>
      <div id="deviceError"></div>
      <select id="category"></select>
      <div id="categoryError"></div>
      <input id="createdBy" />
      <div id="createdByError"></div>
      <input id="assignedTo" />
      <div id="assignedToError"></div>
      <input id="estimate" />
      <div id="estimateError"></div>
      <select id="status"></select>
      <div id="statusError"></div>
      <button id="addTicket" type="submit">Add Ticket</button>
    </form>
    <input id="searchInput" />
    <select id="statusFilter"></select>
    <div id="ticketStatus"></div>
    <div id="ticketList"></div>
    <div id="contadorTickets"></div>
  `;
}

describe("Tickets DOM + funcionalidad", () => {
  beforeEach(() => {
    setupDom();
    window.SIGAM_API = {
      getActivos: vi.fn().mockResolvedValue([
        {
          id_activo: 10,
          serial: "SN-0001",
          modelo: "Laptop Pro",
          sede: "Norte",
          sala: "Soporte"
        }
      ]),
      getCategorias: vi.fn().mockResolvedValue({
        categorias: [
          { id_categoria: 1, nombre: "Hardware" },
          { id_categoria: 2, nombre: "Software" }
        ]
      }),
      getTickets: vi.fn().mockResolvedValue([]),
      createTicket: vi.fn().mockResolvedValue({ id_ticket: 99 }),
      getUser: vi.fn().mockReturnValue({ id_usuario: 5, nombre: "Tester" })
    };

    const ticketsPath = path.resolve(__dirname, "..", "src", "view", "js", "tickets.js");
    loadScript(ticketsPath);
  });

  it("carga categorias en el select desde API", async () => {
    await waitFor(() => {
      const category = document.getElementById("category");
      return category && category.querySelectorAll("option").length > 1;
    });
    const category = document.getElementById("category");
    const options = Array.from(category.querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toContain("Hardware");
    expect(options).toContain("Software");
  });

  it("permite buscar activo por serial y crear ticket con id_activo", async () => {
    await new Promise((r) => setTimeout(r, 0));
    const device = document.getElementById("device");
    const title = document.getElementById("title");
    const description = document.getElementById("description");
    const category = document.getElementById("category");
    const createdBy = document.getElementById("createdBy");
    const status = document.getElementById("status");

    device.value = "SN-0001";
    title.value = "Falla de prueba";
    description.value = "Detalle";
    createdBy.value = "Tester";
    category.innerHTML = '<option value="1">Hardware</option>';
    category.value = "1";
    status.innerHTML = '<option value="Abierto">Abierto</option>';
    status.value = "Abierto";

    const form = document.getElementById("ticketForm");
    form.dispatchEvent(new Event("submit"));
    await new Promise((r) => setTimeout(r, 0));

    expect(window.SIGAM_API.createTicket).toHaveBeenCalled();
    const payload = window.SIGAM_API.createTicket.mock.calls[0][0];
    expect(payload.id_activo).toBe(10);
    expect(payload.id_categoria).toBe(1);
  });
});
