# Profile password update - 2026-03-15

## Escenario
Validar que el cambio de contraseña en Profile dispara el request y muestra estado.

## Pasos
1. Iniciar sesión con un usuario válido.
2. Ir a `Profile`.
3. Ingresar `Current Password`, `New Password` (>= 8 chars) y `Confirm New Password`.
4. Presionar `Update Password`.

## Resultado esperado
- El botón cambia a `Updating...` y se deshabilita durante el envío.
- Se ejecuta la llamada a `PUT /api/usuarios/{id}/password` o fallback `PUT /api/usuarios/{id}`.
- Mensaje `Password updated successfully!` en éxito.
- El formulario se limpia y el estado desaparece después de unos segundos.

## Nota de compatibilidad
- Si el backend devuelve 404/405/501 en `/api/usuarios/{id}/password`, el frontend intenta PATCH en el mismo endpoint y luego PATCH/PUT en `/api/usuarios/{id}`.

## Ajuste de payload
- Se envia `password`, `newPassword`, `new_password`, `oldPassword`, `old_password`, `confirmPassword` y `confirm_password` para compatibilidad con validaciones del backend.
