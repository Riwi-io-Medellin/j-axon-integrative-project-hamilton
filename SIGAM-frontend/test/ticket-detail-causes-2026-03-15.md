# Evidencia - Posibles causas en Ticket Detail

Fecha: 2026-03-15

## Objetivo
Ocultar confianza y mostrar posibles causas si la API las devuelve.

## Pasos
1. Abrir `/ticket-detail?id=...`.
2. Verificar que no se muestra "Confianza".
3. Confirmar que si la respuesta incluye `causas` o `posibles_causas`, se listan como "Posibles causas".

## Resultado
Pendiente de validacion en entorno local.
