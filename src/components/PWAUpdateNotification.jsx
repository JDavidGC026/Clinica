import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

const PWAUpdateNotification = () => {
  const { updateAvailable, updateApp } = usePWA();
  const [showNotification, setShowNotification] = React.useState(false);

  React.useEffect(() => {
    if (updateAvailable) {
      setShowNotification(true);
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    updateApp();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground text-sm">Actualización disponible</h3>
                  <p className="text-xs text-muted-foreground">Nueva versión de la aplicación</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex space-x-2 mt-3">
              <Button variant="outline" onClick={handleDismiss} size="sm" className="flex-1">
                Después
              </Button>
              <Button onClick={handleUpdate} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Actualizar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdateNotification;