// Login flow: validate inputs, call API, persist token/user, redirect.
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm")
    const emailInput = document.getElementById("email")
    const passwordInput = document.getElementById("password")
    const statusEl = document.getElementById("loginStatus")
    const submitBtn = document.getElementById("loginBtn")

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
        submitBtn.textContent = isSubmitting ? "Loading..." : "enter"
    }

    if (!form) {
        return
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault()
        setStatus("")

        const email = emailInput.value.trim()
        const password = passwordInput.value

        if (!email || !password) {
            setStatus("Ingresa email y password.", "error")
            return
        }

        if (!window.SIGAM_API) {
            setStatus("Config de API no cargada.", "error")
            return
        }

        try {
            setSubmitting(true)
            const data = await window.SIGAM_API.apiRequest("/api/auth/login", {
                method: "POST",
                body: { email, password }
            })

            window.SIGAM_API.setToken(data.token)
            window.SIGAM_API.setUser(data.user)

            setStatus("Login correcto. Redirigiendo...", "success")
            window.location.href = "/dashboard"
        } catch (error) {
            setStatus(error.message || "Error de autenticacion.", "error")
        } finally {
            setSubmitting(false)
        }
    })
})
