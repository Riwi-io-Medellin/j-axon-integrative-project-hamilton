# Evidencia - Normalizacion de colecciones API

Fecha: 2026-03-15

## Objetivo
Validar que las vistas Tickets, Inventory, Dashboard, Reports y Calendar puedan leer colecciones desde respuestas API con envoltorios comunes (data/items/rows/results).

## Pasos
1. Iniciar sesion con un usuario valido.
2. Ir a `/tickets` y confirmar que se lista al menos un ticket cuando la API responde con data envuelta.
3. Ir a `/inventory` y confirmar que se listan activos/categorias/proveedores.
4. Ir a `/dashboard` y confirmar que los contadores y graficas cargan datos.
5. Ir a `/reports` y confirmar que las graficas cargan datos.
6. Ir a `/calendar` y confirmar que se cargan mantenimientos y activos.

## Resultado
- Pendiente de validacion con datos reales en el entorno de integracion.
