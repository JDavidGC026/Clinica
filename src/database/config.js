import mysql from 'mysql2/promise';

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Cambia por tu contraseña de MySQL
  database: 'grupo_medico_delux',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Pool de conexiones para mejor rendimiento
let pool = null;

export const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });
  }
  return pool;
};

export const getConnection = async () => {
  try {
    const pool = createPool();
    return await pool.getConnection();
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
};

export const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const executeTransaction = async (queries) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en transacción:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export default dbConfig;