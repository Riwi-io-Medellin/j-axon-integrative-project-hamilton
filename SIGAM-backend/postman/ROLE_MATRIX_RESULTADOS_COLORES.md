# Matriz de acceso por rol (con resultados)

Verde = se obtuvo lo esperado (segun tests). Rojo = no se obtuvo lo esperado. Gris = sin ejecucion/otro rol.

Rol inferido del run: **gerente** (coincidencia 87.8%).

<table style="border-collapse:collapse;width:100%;background:#0b0f14;color:#f8fafc;">
  <thead>
    <tr>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Metodo</th>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Endpoint</th>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Gerente</th>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Analista</th>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Tecnico</th>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Usuario</th>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Auditor</th>
      <th style="border:1px solid #334155;padding:8px;background:#111827;color:#f9fafb;">Ejecuciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/health</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/auth/register</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;">5/5</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/auth/login</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;">5/5</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/auth/admin-panel</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/auth/configuracion</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/auth/perfil</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/usuarios</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/usuarios</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/activos</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/activos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/activos/:id/historial</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/activos</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/activos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/activos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets/activo/:id_activo</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets/asignados/mis</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets/metricas</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">2/2</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200/403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">2/2</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200/403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PATCH</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets/:id/estado</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200/403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/tickets/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos/tecnico/:id_tecnico</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos/:id/consumos</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">2/2</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos/:id/consumos</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/mantenimientos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/metricas/operacion</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/categorias</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/repuestos</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/repuestos/bajo-stock</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/repuestos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/repuestos</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/repuestos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/repuestos/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/proveedores</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/proveedores/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/proveedores</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/proveedores/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/proveedores/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/ubicaciones</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/ubicaciones/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/ubicaciones</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/ubicaciones/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/ubicaciones/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias/:id/asignaciones</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias/asignar</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">2/2</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/licencias/asignacion/:id_asignacion</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/software</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">GET</td>
      <td style="border:1px solid #334155;padding:8px;">/software/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">POST</td>
      <td style="border:1px solid #334155;padding:8px;">/software</td>
      <td style="border:1px solid #334155;padding:8px;background:#0f3d2e;color:#e6f4ea;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">201</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">1/1</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">PUT</td>
      <td style="border:1px solid #334155;padding:8px;">/software/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #334155;padding:8px;">DELETE</td>
      <td style="border:1px solid #334155;padding:8px;">/software/:id</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">200</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;background:#1f2937;color:#cbd5f5;text-align:center;">403</td>
      <td style="border:1px solid #334155;padding:8px;">-</td>
    </tr>
  </tbody>
</table>
