/**
 * SIGAM - Footer Component
 * Componente de pie de página estandarizado
 */

/**
 * Renderiza el footer completo
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.simple - Si es true, renderiza versión simplificada
 * @returns {string} HTML del footer
 */
export function Footer({ simple = false } = {}) {
  if (simple) {
    return FooterSimple();
  }
  return FooterFull();
}

/**
 * Footer completo con todas las secciones
 */
function FooterFull() {
  const currentYear = new Date().getFullYear();
  
  return `
    <footer class="sigam-footer">
      <div class="sigam-footer-container">
        <div class="sigam-footer-main">
          <!-- Brand Section -->
          <div class="sigam-footer-brand">
            <div class="sigam-footer-logo">
              <img src="/assets/Logo-Fuego.png" alt="SIGAM Logo" onerror="this.style.display='none'">
              <span class="sigam-footer-logo-text">SIGAM</span>
            </div>
            <p class="sigam-footer-description">
              Sistema Integral de Gestion Ambiental Municipal. Optimizamos la gestion de activos y tickets para una administracion ambiental eficiente.
            </p>
            <div class="sigam-footer-social">
              <a href="#" class="sigam-footer-social-link" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" class="sigam-footer-social-link" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" class="sigam-footer-social-link" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" class="sigam-footer-social-link" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <!-- Quick Links -->
          <div class="sigam-footer-links">
            <h4 class="sigam-footer-links-title">Navegacion</h4>
            <ul class="sigam-footer-links-list">
              <li><a href="#/dashboard">Dashboard</a></li>
              <li><a href="#/tickets">Tickets</a></li>
              <li><a href="#/inventory">Inventario</a></li>
              <li><a href="#/calendar">Calendario</a></li>
              <li><a href="#/reports">Reportes</a></li>
            </ul>
          </div>
          
          <!-- Resources -->
          <div class="sigam-footer-links">
            <h4 class="sigam-footer-links-title">Recursos</h4>
            <ul class="sigam-footer-links-list">
              <li><a href="#/help">Centro de Ayuda</a></li>
              <li><a href="#/docs">Documentacion</a></li>
              <li><a href="#/faq">Preguntas Frecuentes</a></li>
              <li><a href="#/support">Soporte Tecnico</a></li>
            </ul>
          </div>
          
          <!-- Contact -->
          <div class="sigam-footer-links">
            <h4 class="sigam-footer-links-title">Contacto</h4>
            <div class="sigam-footer-contact">
              <div class="sigam-footer-contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>Av. Principal 123, Ciudad</span>
              </div>
              <div class="sigam-footer-contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href="tel:+1234567890">+1 (234) 567-890</a>
              </div>
              <div class="sigam-footer-contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a href="mailto:contacto@sigam.com">contacto@sigam.com</a>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer Bottom -->
        <div class="sigam-footer-bottom">
          <p class="sigam-footer-copyright">
            ${currentYear} SIGAM. Todos los derechos reservados.
          </p>
          <div class="sigam-footer-legal">
            <a href="#/privacy">Politica de Privacidad</a>
            <a href="#/terms">Terminos de Uso</a>
            <a href="#/cookies">Politica de Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Footer simple para páginas internas
 */
function FooterSimple() {
  const currentYear = new Date().getFullYear();
  
  return `
    <footer class="sigam-footer-simple">
      <div class="sigam-footer-container">
        <p class="sigam-footer-copyright">
          ${currentYear} SIGAM - Sistema Integral de Gestion Ambiental Municipal
        </p>
        <div class="sigam-footer-legal">
          <a href="#/privacy">Privacidad</a>
          <a href="#/terms">Terminos</a>
          <a href="#/support">Soporte</a>
        </div>
      </div>
    </footer>
  `;
}

export default Footer;
