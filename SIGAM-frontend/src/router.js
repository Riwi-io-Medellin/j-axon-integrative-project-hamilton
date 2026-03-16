import { getToken, getUser } from './state/storage.js';

/**
 * Router básico para SPA.
 * Gestiona la navegación y renderizado de componentes basados en la URL.
 */
export const router = {
    routes: {},
    publicRoutes: new Set(['/login', '/register']),
    defaultRouteResolver: null,
    currentBodyClasses: [],

    /**
     * Registra una ruta y su componente asociado.
     * @param {string} path - La ruta URL (ej: '/login').
     * @param {object} pageModule - Un objeto con las funciones `render` e `init`.
     */
    addRoute(path, pageModule) {
        this.routes[path] = pageModule;
    },

    /**
     * Navega a una nueva ruta actualizando el historial.
     * @param {string} path 
     * @param {object} options
     * @param {boolean} options.replace
     */
    navigateTo(path, options = {}) {
        const { replace = false } = options;
        if (replace) {
            window.history.replaceState({}, "", path);
        } else {
            window.history.pushState({}, "", path);
        }
        this.handleRoute();
    },

    /**
     * Define el resolver para la ruta por defecto según el usuario.
     * @param {function} resolver
     */
    setDefaultRouteResolver(resolver) {
        this.defaultRouteResolver = resolver;
    },

    setPublicRoutes(routes = []) {
        this.publicRoutes = new Set(routes);
    },

    getDefaultRoute(user) {
        if (typeof this.defaultRouteResolver === 'function') {
            return this.defaultRouteResolver(user);
        }
        return '/dashboard';
    },

    /**
     * Procesa la URL actual y renderiza el contenido en #app.
     */
    async handleRoute() {
        let path = window.location.pathname;
        // Normalizar la ruta: eliminar la barra final si no es la raíz
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        const app = document.getElementById('app');
        const token = getToken();
        const user = getUser();
        const isAuthenticated = Boolean(token);

        if (path === '/') {
            const target = isAuthenticated ? this.getDefaultRoute(user) : '/login';
            if (target && target !== path) {
                this.navigateTo(target, { replace: true });
                return;
            }
        }

        const isPublic = this.publicRoutes.has(path);
        if (!isAuthenticated && !isPublic) {
            this.navigateTo('/login', { replace: true });
            return;
        }
        if (isAuthenticated && isPublic) {
            const target = this.getDefaultRoute(user);
            if (target && target !== path) {
                this.navigateTo(target, { replace: true });
                return;
            }
        }

        // Busca el módulo de la página para la ruta actual, con fallback a /404
        const pageModule = this.routes[path] || this.routes['/404'] || { render: () => '<h1>404 - Not Found</h1>' };

        if (pageModule && pageModule.meta && Array.isArray(pageModule.meta.roles) && pageModule.meta.roles.length > 0) {
            const role = (user && (user.role || user.rol || user.ROLE || user.Rol)) || '';
            const normalizedRole = String(role || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/\s+/g, '');
            const allowed = pageModule.meta.roles.some((item) => {
                return String(item || '')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .replace(/\s+/g, '') === normalizedRole;
            });
            if (!allowed) {
                const target = this.getDefaultRoute(user) || '/dashboard';
                if (target !== path) {
                    this.navigateTo(target, { replace: true });
                    return;
                }
            }
        }

        if (pageModule && pageModule.meta && pageModule.meta.bodyClass !== undefined) {
            const nextClasses = Array.isArray(pageModule.meta.bodyClass)
                ? pageModule.meta.bodyClass
                : String(pageModule.meta.bodyClass || '')
                    .split(/\s+/)
                    .filter(Boolean);
            if (this.currentBodyClasses.length) {
                document.body.classList.remove(...this.currentBodyClasses);
            }
            if (nextClasses.length) {
                document.body.classList.add(...nextClasses);
            }
            this.currentBodyClasses = nextClasses;
        } else if (this.currentBodyClasses.length) {
            document.body.classList.remove(...this.currentBodyClasses);
            this.currentBodyClasses = [];
        }

        if (pageModule && typeof pageModule.render === 'function') {
            // 1. Renderiza el HTML del componente
            app.innerHTML = await pageModule.render();

            // 2. Ejecuta la lógica de inicialización si existe
            if (typeof pageModule.init === 'function') {
                pageModule.init();
            }
        } else {
            // Si no se encuentra la ruta, muestra un 404 genérico
            app.innerHTML = '<h1>404 - Not Found</h1>';
        }
    },

    init() {
        // Escuchar botones de navegación del navegador (atrás/adelante)
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Carga inicial
        this.handleRoute();
    }
};
