# Prueba: Hoja de vida del activo

- Fecha: 16-03-2026
- Entorno: Frontend local y backend de pruebas.

## Pasos
1. Abrir la vista de inventario (`/inventory`) y hacer clic en una tarjeta de activo (sin pulsar el botón "Edit").
2. Confirmar que el navegador redirecciona a `/asset-history?id=<id del activo>` y que aparece el título con el nombre del activo.
3. Verificar que los campos de "Especificaciones y trazabilidad" muestran proveedor, ubicación y especificaciones técnicas (con los datos retornados por el API).
4. En "Gestión del ciclo de vida" comprobar que aparece la fecha de compra o adquisición y una alerta si el activo supera los 48 meses.
5. En "Historial de custodia y mantenimiento" revisar que se enlistan asignaciones históricas, mantenimientos asociados (con fechas, técnico y acciones realizadas) y eventos del historial del activo.
6. En "Métricas de confiabilidad" el MTTR y MTBF se actualizan según la secuencia de mantenimientos; si no hay datos, se muestra "N/A".
7. En "Disposición final" validar que, si existe un documento con nombre/tipo de certificado de borrado, aparece el enlace; si no, se muestra el mensaje por defecto.
8. En un mantenimiento, usar "Ver repuestos" y comprobar que se cargan desde `/api/mantenimientos/:id/consumos` y se cachean.
9. Pulsar el botón "Volver al inventario" y confirmar que la navegación regresa a `/inventory`.

## Resultado esperado
- La hoja de vida se carga con los datos del backend, los mantenimientos filtrados por activo y las métricas calculadas. Los campos obligatorios se muestran con valores o con texto de respaldo si están vacíos.
