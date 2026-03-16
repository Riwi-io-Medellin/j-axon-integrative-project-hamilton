# Prueba manual: metadata de activos en Calendar

- Fecha: 15-03-2026
- Entorno: Frontend local en modo desarrollo apuntando al backend de pruebas.

## Pasos ejecutados
1. Abrir la vista Calendar y programar un mantenimiento asignado a un activo desde el select.
2. Confirmar que el evento aparece inmediatamente en el calendario y que el tooltip muestra el nombre del activo en lugar de `[object Object]`.
3. Refrescar la página y verificar que el evento sigue visible, que la tarjeta en "Upcoming" conserva el activo y que no desaparece al aplicar el filtro por activos.

## Resultado
- El calendario mantiene el evento con el label correcto y los filtros aplican por `assetId` sin perder los eventos tras el refresh.
