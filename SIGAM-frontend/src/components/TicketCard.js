export const renderTicketCardBody = ({ ticket, index, statusClass }) => {
  const categoryLabel = ticket.category || ticket.classification || "Sin categoria";
  const classificationLabel = ticket.classification || "Sin clasificacion IA";
  const safeStatusClass = statusClass ? statusClass(ticket.status) : "";
  return `
    <div class="ticket-status ${safeStatusClass}">${ticket.status || "Pending"}</div>

    <div class="ticket-title">
        ${ticket.title || "Ticket"}
    </div>

    <div class="ticket-desc">
        ${ticket.description}
    </div>

    <div class="ticket-info ticket-line">
        <span>TK-${ticket.id || index + 1}</span>
        <span>${ticket.device || "Activo"}</span>
        <span>${categoryLabel}</span>
    </div>

    <div class="ticket-info ticket-meta">
        <span>Creado por: ${ticket.createdBy || "Sin usuario"}</span>
        <span>Asignado a: ${ticket.assignedTo || "Sin asignar"}</span>
        <span>${ticket.date}</span>
        <span>${ticket.estimate || "Sin estimado"}</span>
    </div>
    <div class="ticket-info ticket-meta">
        <span>Clasificacion IA: ${classificationLabel}</span>
    </div>
  `;
};
