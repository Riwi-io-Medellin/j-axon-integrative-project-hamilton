// Register flow: validate inputs, call API, redirect to login on success.
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm")
    const nameInput = document.getElementById("name")
    const surnameInput = document.getElementById("surname")
    const emailInput = document.getElementById("email")
    const passwordInput = document.getElementById("password")
    const confirmInput = document.getElementById("confirmPassword")
    const roleInput = document.getElementById("role")
    const statusEl = document.getElementById("registerStatus")
    const submitBtn = document.getElementById("registerBtn")

    function setStatus(message, type) {
        if (!statusEl) {
            return
        }
        statusEl.textContent = message || ""
        statusEl.style.color = "#6b7280"
        if (type === "error") {
            statusEl.style.color = "#dc2626"
        }
        if (type === "success") {
            statusEl.style.color = "#059669"
        }
    }

    function setSubmitting(isSubmitting) {
        if (!submitBtn) {
            return
        }
        submitBtn.disabled = isSubmitting
        submitBtn.textContent = isSubmitting ? "Creating..." : "create account"
    }

    if (!form) {
        return
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault()
        setStatus("")

        const name = nameInput.value.trim()
        const surname = surnameInput.value.trim()
        const email = emailInput.value.trim()
        const password = passwordInput.value
        const confirmPassword = confirmInput.value
        const role = roleInput ? roleInput.value : "Usuario"

        if (!name || !surname || !email || !password) {
            setStatus("Completa todos los campos requeridos.", "error")
            return
        }

        if (password !== confirmPassword) {
            setStatus("Las contrasenas no coinciden.", "error")
            return
        }

        if (!window.SIGAM_API) {
            setStatus("Config de API no cargada.", "error")
            return
        }

        try {
            setSubmitting(true)
            await window.SIGAM_API.apiRequest("/api/auth/register", {
                method: "POST",
                body: {
                    nombre: `${name} ${surname}`.trim(),
                    email,
                    password,
                    rol: role
                }
            })

            setStatus("Registro exitoso. Redirigiendo...", "success")
            window.location.href = "/login"
        } catch (error) {
            setStatus(error.message || "Error de registro.", "error")
        } finally {
            setSubmitting(false)
        }
    })
})
