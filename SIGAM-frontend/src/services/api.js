// Placeholder para el cliente de API real.
// Esto es un mock para permitir que la página de Login funcione.
// La implementación real debería usar fetch y leer la configuración.

export const api = {
    auth: {
        login: async (email, password) => {
            console.log(`Attempting login for ${email}`);
            // Simula una llamada a la API
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (email === 'test@j-axon.com' && password === 'password') {
                        const mockUser = { name: 'Test User', email: 'test@j-axon.com', role: 'Gerente' };
                        const mockToken = 'fake-jwt-token-for-testing';
                        resolve({ user: mockUser, token: mockToken });
                    } else {
                        reject(new Error('Invalid credentials'));
                    }
                }, 1000);
            });
        },
        
        register: async (userData) => {
            console.log('Registering user:', userData);
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Simulamos éxito siempre por ahora
                    resolve({ message: 'User created' });
                }, 1000);
            });
        }
    },
    
    dashboard: {
        getSummary: async () => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({
                    totalAssets: 124,
                    openTickets: 12,
                    scheduledMaintenance: 5,
                    totalCost: 45200
                }), 500);
            });
        }
    }
};