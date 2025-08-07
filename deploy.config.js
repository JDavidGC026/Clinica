// ========================================
// CONFIGURACIÓN DE DEPLOY
// Clínica Delux - Sistema de Gestión Médica
// ========================================

export const deployConfig = {
  // Configuración básica del proyecto
  project: {
    name: 'Clínica Delux',
    version: '1.0.0',
    description: 'Sistema de Gestión Médica',
  },

  // Directorios
  directories: {
    build: 'dist',
    source: 'src',
    public: 'public',
    api: 'public/api',
  },

  // Configuración de deploy
  deploy: {
    // Producción
    production: {
      target: '/var/www/html/grupodelux',
      url: 'http://localhost/grupodelux',
      backup: true,
      verify: true,
      permissions: {
        owner: 'www-data:www-data',
        files: '644',
        directories: '755',
      },
    },
    
    // Staging (para pruebas)
    staging: {
      target: '/var/www/html/grupodelux-staging',
      url: 'http://localhost/grupodelux-staging',
      backup: true,
      verify: true,
      permissions: {
        owner: 'www-data:www-data',
        files: '644',
        directories: '755',
      },
    },

    // Desarrollo local
    development: {
      target: '/tmp/clinica-dev',
      url: 'http://localhost:3000',
      backup: false,
      verify: false,
      permissions: {
        owner: `${process.env.USER}:${process.env.USER}`,
        files: '644',
        directories: '755',
      },
    },
  },

  // APIs a verificar después del deploy
  apiEndpoints: [
    'health-check',
    'login',
    'patients',
    'professionals',
    'appointments',
    'disciplines',
    'users',
    'roles',
    'permissions',
  ],

  // Archivos críticos que deben existir
  criticalFiles: [
    'index.html',
    'manifest.json',
    'sw.js',
    'api/config.php',
    'api/login.php',
  ],

  // Archivos a excluir del deploy
  exclude: [
    'node_modules/',
    'src/',
    '*.log',
    '*.tmp',
    '.git/',
    '.env.local',
    'deploy.config.js',
    'scripts/',
  ],

  // Configuración de tests
  tests: {
    login: {
      username: 'admin',
      password: 'admin123',
      expectedResponse: 'success',
    },
    
    healthCheck: {
      timeout: 5000,
      retries: 3,
    },
  },

  // Notificaciones (para futuras implementaciones)
  notifications: {
    slack: {
      enabled: false,
      webhook: '',
      channel: '#deploys',
    },
    
    email: {
      enabled: false,
      recipients: [],
      smtp: {},
    },
  },

  // Configuración de rollback
  rollback: {
    keepBackups: 5,
    autoRollbackOnFailure: true,
  },

  // Variables de entorno específicas para deploy
  env: {
    NODE_ENV: 'production',
    BUILD_TARGET: 'production',
    API_BASE_URL: './api/',
  },
};

export default deployConfig;
