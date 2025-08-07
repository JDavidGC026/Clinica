import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

const PWAInstallPrompt = () => {
  const { isInstallable, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (isInstallable && !dismissed) {
      // Mostrar el prompt después de 3 segundos
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Recordar que el usuario rechazó la instalación por 7 días
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  // Verificar si el usuario ya rechazó la instalación recientemente
  React.useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa_install_dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent-alt rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Instalar Aplicación</h3>
                  <p className="text-sm text-muted-foreground">Acceso rápido desde tu dispositivo</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                <span>Funciona sin conexión</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Monitor className="w-4 h-4" />
                <span>Acceso directo desde escritorio</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDismiss} className="flex-1">
                Ahora no
              </Button>
              <Button onClick={handleInstall} className="flex-1 button-primary-gradient">
                Instalar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;