// Loads the shared navbar and highlights the active route.
(() => {
    const container = document.getElementById("app-navbar");
    if (!container) {
        return;
    }

    const normalizePath = (pathname) => {
        let page = (pathname || "").toLowerCase().trim();
        if (!page || page === "/") {
            return "dashboard";
        }
        page = page.replace(/^\/+/, "");
        if (page.startsWith("pages/")) {
            page = page.slice("pages/".length);
        }
        if (page.endsWith(".html")) {
            page = page.slice(0, -".html".length);
        }
        return page || "dashboard";
    };

    const currentPage = normalizePath(location.pathname);

    fetch("../services/navbar.html")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Navbar fetch failed");
            }
            return response.text();
        })
        .then((html) => {
            container.innerHTML = html;
            const links = container.querySelectorAll("[data-page]");
            links.forEach((link) => {
                const page = link.getAttribute("data-page");
                if (page && page.toLowerCase() === currentPage) {
                    link.classList.add("active", "fw-bold", "text-primary");
                }
            });
        })
        .catch((error) => {
            console.warn("Navbar load failed:", error);
        });
})();
