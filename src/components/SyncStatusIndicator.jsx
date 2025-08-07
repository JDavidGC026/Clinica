import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/ApiService';
import HybridStorageService from '@/services/HybridStorageService';

const SyncStatusIndicator = () => {
  const [syncStats, setSyncStats] = useState({
    total: 0,
    synced: 0,
    pending: 0,
    failed: 0,
    queueLength: 0,
    lastSync: null
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Actualizar estadísticas cada 5 segundos
    const updateStats = () => {
      const stats = apiService.getSyncStats();
      setSyncStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    // Listeners para eventos de red
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listeners para eventos de sincronización
    const handleSyncSuccess = (event) => {
      updateStats();
      toast({
        title: "✅ Sincronización exitosa",
        description: `${event.detail.synced} elementos sincronizados`,
      });
    };

    const handleDataChanged = () => {
      updateStats();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncSuccess', handleSyncSuccess);
    window.addEventListener('localDataChanged', handleDataChanged);
    window.addEventListener('dataUpdated', handleDataChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncSuccess', handleSyncSuccess);
      window.removeEventListener('localDataChanged', handleDataChanged);
      window.removeEventListener('dataUpdated', handleDataChanged);
    };
  }, []);

  const handleForceSync = async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede sincronizar sin conexión a internet.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      await apiService.forceSyncAll();
      toast({
        title: "Sincronización completada",
        description: "Todos los datos han sido sincronizados.",
      });
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description: "No se pudo completar la sincronización: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (syncStats.pending > 0) return 'text-yellow-500';
    if (syncStats.failed > 0) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff;
    if (isSyncing) return RefreshCw;
    if (syncStats.pending > 0) return Clock;
    if (syncStats.failed > 0) return AlertCircle;
    return CheckCircle;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (isSyncing) return 'Sincronizando...';
    if (syncStats.pending > 0) return `${syncStats.pending} pendientes`;
    if (syncStats.failed > 0) return `${syncStats.failed} fallidos`;
    return 'Sincronizado';
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-2 bg-card border border-border rounded-xl shadow-2xl p-4 w-80"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Estado de Sincronización
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold">{syncStats.total}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-xs text-green-600">Sincronizados</div>
                  <div className="font-semibold text-green-700">{syncStats.synced}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <div className="text-xs text-yellow-600">Pendientes</div>
                  <div className="font-semibold text-yellow-700">{syncStats.pending}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <div className="text-xs text-red-600">Fallidos</div>
                  <div className="font-semibold text-red-700">{syncStats.failed}</div>
                </div>
              </div>

              {syncStats.lastSync && (
                <div className="text-xs text-muted-foreground">
                  Última sincronización: {new Date(syncStats.lastSync).toLocaleTimeString('es-ES')}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleForceSync}
                  disabled={!isOnline || isSyncing}
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </div>

              {!isOnline && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <div className="text-xs text-red-700">
                    📱 Modo offline: Los cambios se guardan localmente y se sincronizarán cuando haya conexión.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-card border border-border rounded-full p-3 shadow-lg hover:shadow-xl transition-all ${getStatusColor()}`}
      >
        <StatusIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
        
        {(syncStats.pending > 0 || syncStats.failed > 0) && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {syncStats.pending + syncStats.failed}
          </div>
        )}
      </motion.button>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;