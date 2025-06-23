import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, RefreshCw, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/ApiService';

const ApiLogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, levelFilter, searchTerm]);

  const loadLogs = () => {
    const allLogs = apiService.getLogs();
    setLogs(allLogs);
  };

  const filterLogs = () => {
    let filtered = logs;

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  };

  const handleClearLogs = () => {
    apiService.clearLogs();
    setLogs([]);
    toast({
      title: "Logs limpiados",
      description: "Todos los logs han sido eliminados.",
    });
  };

  const handleExportLogs = () => {
    apiService.exportLogs();
    toast({
      title: "Logs exportados",
      description: "Los logs se han descargado como archivo JSON.",
    });
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warn': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-green-500 bg-green-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogStats = () => {
    const stats = {
      total: logs.length,
      error: logs.filter(l => l.level === 'error').length,
      warn: logs.filter(l => l.level === 'warn').length,
      info: logs.filter(l => l.level === 'info').length
    };
    return stats;
  };

  const stats = getLogStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Logs de API</h1>
          <p className="text-muted-foreground mt-1">Monitoreo de peticiones y errores del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleExportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleClearLogs} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <Info className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Errores</p>
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Advertencias</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warn}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Info</p>
              <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Nivel</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            >
              <option value="all">Todos los niveles</option>
              <option value="error">Solo errores</option>
              <option value="warn">Solo advertencias</option>
              <option value="info">Solo información</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="bg-card rounded-xl shadow-lg border border-border/50">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            Logs Recientes ({filteredLogs.length})
          </h2>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Info className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No hay logs</h3>
              <p className="text-muted-foreground text-sm">
                {logs.length === 0 
                  ? 'No se han registrado logs aún' 
                  : 'No se encontraron logs con los filtros aplicados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border-l-4 p-4 rounded-r-lg ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getLogIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {log.message}
                          </p>
                          <span className="text-xs text-gray-500 ml-2 shrink-0">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        {log.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              Ver detalles
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiLogsViewer;