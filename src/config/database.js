// Configuración de base de datos para producción
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configuración para producción en Hostinger
const productionConfig = {
  host: 'localhost', // En Hostinger suele ser localhost
  user: import.meta.env.VITE_DB_USER || 'tu_usuario_mysql',
  password: import.meta.env.VITE_DB_PASSWORD || 'tu_password_mysql',
  database: import.meta.env.VITE_DB_NAME || 'tu_base_datos',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Configuración para desarrollo
const developmentConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'grupo_medico_delux',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

export const dbConfig = isProduction ? productionConfig : developmentConfig;

// Función para verificar si estamos en el navegador
export const isBrowser = typeof window !== 'undefined';

// Configuración de fallback para localStorage cuando MySQL no esté disponible
export const useLocalStorageFallback = true;

export default dbConfig;