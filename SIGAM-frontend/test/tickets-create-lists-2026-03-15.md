# Evidencia - Listas en crear ticket

Fecha: 2026-03-15

## Objetivo
Evitar bloqueo del formulario cuando no hay categorias disponibles y mantener listas de activos.

## Pasos
1. Iniciar sesion.
2. Ir a `/tickets`.
3. Abrir modal de crear ticket.
4. Verificar que la lista de seriales de activos se carga.
5. Si `/api/tickets/categorias` falla, confirmar que el selector de categoria queda deshabilitado y el formulario permite enviar sin categoria.

## Resultado
Pendiente de validacion en entorno local.
