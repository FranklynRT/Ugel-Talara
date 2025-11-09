import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la ruta correcta (desde src/database/ -> Api/)
// Si ya se cargó en index.js, esto no causará problemas
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Función para verificar y reconectar la base de datos
export const verifyConnection = async () => {
  try {
    await pool.execute('SELECT 1');
    console.log('✅ Conexión a la base de datos verificada');
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión a la base de datos:', error);
    return false;
  }
};

// Función para reintentar operaciones de base de datos
export const retryDatabaseOperation = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isConnectionError = 
        error.code === 'ECONNRESET' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ETIMEDOUT' ||
        error.errno === -4077; // ECONNRESET en Windows
      
      if (isConnectionError) {
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // Delay incremental: 1s, 2s, 3s
          console.log(`🔄 Error de conexión detectado. Reintentando en ${delay/1000} segundos... (intento ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          console.error(`❌ Todos los intentos fallaron. Último error:`, error.message);
        }
      }
      
      throw error;
    }
  }
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  // Configuraciones del pool
  connectionLimit: 10,
  queueLimit: 0,
  // Configuraciones adicionales
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: true,
  // Timeout de conexión
  connectTimeout: 60000,
  // Reconexión automática
  reconnect: true,
  // Configuraciones para evitar pérdida de conexión
  waitForConnections: true,
  // Tiempo máximo de espera para obtener una conexión
  acquireTimeout: 60000,
  // Habilitar múltiples statements (opcional, según necesidad)
  multipleStatements: false,
  // Aumentar el tamaño máximo del paquete para permitir archivos grandes (500MB = 524288000 bytes)
  // Nota: También se debe configurar en el servidor MySQL, esto es solo para la conexión
  // SET GLOBAL max_allowed_packet=524288000; en MySQL
  typeCast: function (field, next) {
    // Manejar BLOB y LONGBLOB
    if (field.type === 'BLOB' || field.type === 'LONGBLOB') {
      return field.buffer();
    }
    // Manejar campos JSON - parsearlos automáticamente
    if (field.type === 'JSON' || field.type === 245) { // 245 es el código para JSON en MySQL
      const value = field.string();
      if (value === null || value === undefined) {
        return null;
      }
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn('⚠️ Error al parsear campo JSON:', field.name, e);
        return value; // Devolver el string original si falla el parsing
      }
    }
    return next();
  }
});

export { pool };