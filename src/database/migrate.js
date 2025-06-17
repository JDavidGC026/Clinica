import createDatabase from './setup.js';

const migrate = async () => {
  try {
    console.log('Iniciando migración de datos...');
    
    // Ejecutar setup de base de datos
    await createDatabase();
    
    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error en migración:', error);
    process.exit(1);
  }
};

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export default migrate;