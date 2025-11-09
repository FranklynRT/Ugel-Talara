// Ruta: src/lib/api.ts
// CONFIGURACIÓN NGROK PARA SISTEMA COMITÉ
// ======================================
// Este archivo contiene la URL del API para todo el sistema de comité.
// Para actualizar cuando cambies de servidor ngrok:
// 1. Ejecuta: cd Api && npm run public
// 2. Copia la URL que aparece en consola (ej: https://xxxx.ngrok-free.dev)
// 3. Actualiza la constante API_URL abajo con: https://xxxx.ngrok-free.dev/ugel-talara
// 
// La URL actual es activa y funciona con el sistema de comité.

const API_URL = "http://localhost:9000/api";

// Export API_BASE_URL for use in components
export const API_BASE_URL = API_URL;

// Esta función será tu nuevo "fetch" personalizado
export const fetchConToken = async (endpoint: string, options: RequestInit = {}) => {
  // 1. Obtiene el token guardado en el navegador
  const token = localStorage.getItem('token');

  // 2. Prepara las cabeceras (headers)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers, // Permite añadir otras cabeceras si es necesario
  };

  // 3. Si el token existe, lo añade a la cabecera de Autorización
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Realiza la petición fetch con las cabeceras actualizadas
  const sanitizedEndpoint = endpoint.replace(/^\/+/, '');
  const response = await fetch(`${API_URL}/${sanitizedEndpoint}`, {
    ...options,
    headers,
  });

  // 5. Si la respuesta es 401 o 403, el token es inválido.
  // Solo lanzar error sin redireccionar automáticamente
  if (response.status === 401 || response.status === 403) {
    throw new Error('Token inválido o expirado. Se requiere iniciar sesión.');
  }
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Ocurrió un error en la petición.');
  }

  return data;
};