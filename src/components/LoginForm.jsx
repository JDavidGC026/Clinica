import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Intentar login con base de datos primero
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Login exitoso con base de datos
        onLogin(result.user);
        toast({
          title: "¡Bienvenido!",
          description: `Hola ${result.user.name}, has iniciado sesión correctamente.`,
        });
      } else {
        // Si falla la base de datos, usar usuarios locales como fallback
        const validUsers = [
          { username: 'admin', password: 'admin123', name: 'Admin General', role: 'Administrador', id: 1 },
          { username: 'gerente', password: 'gerente123', name: 'Gerente Principal', role: 'Gerente', id: 2 },
          { username: 'profesional1', password: 'prof123', name: 'Dr. Carlos Ruiz', role: 'Profesional', id: 3 },
          { username: 'recepcion', password: 'rec123', name: 'María López', role: 'Recepcionista', id: 4 }
        ];

        const user = validUsers.find(
          u => u.username === formData.username && u.password === formData.password
        );

        if (user) {
          onLogin(user);
          toast({
            title: "¡Bienvenido!",
            description: `Hola ${user.name}, has iniciado sesión correctamente (modo local).`,
          });
        } else {
          toast({
            title: "Error de autenticación",
            description: result.error || "Usuario o contraseña incorrectos.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      
      // Fallback a usuarios locales si hay error de conexión
      const validUsers = [
        { username: 'admin', password: 'admin123', name: 'Admin General', role: 'Administrador', id: 1 },
        { username: 'gerente', password: 'gerente123', name: 'Gerente Principal', role: 'Gerente', id: 2 },
        { username: 'profesional1', password: 'prof123', name: 'Dr. Carlos Ruiz', role: 'Profesional', id: 3 },
        { username: 'recepcion', password: 'rec123', name: 'María López', role: 'Recepcionista', id: 4 }
      ];

      const user = validUsers.find(
        u => u.username === formData.username && u.password === formData.password
      );

      if (user) {
        onLogin(user);
        toast({
          title: "¡Bienvenido!",
          description: `Hola ${user.name}, has iniciado sesión correctamente (modo offline).`,
        });
      } else {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar al servidor. Verifica tu conexión.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md"
    >
      <div className="glass-effect rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <Lock className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Clínica Delux</h1>
          <p className="text-purple-200">Sistema de Gestión Médica</p>
          <p className="text-purple-300 text-sm mt-2">🇲🇽 Ciudad de México, México</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ingresa tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-300"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <p className="text-xs text-purple-200 mb-2">Usuarios de prueba:</p>
          <div className="text-xs text-purple-300 space-y-1">
            <div><strong>Base de datos:</strong> admin / password (Administrador)</div>
            <div>gerente / password (Gerente)</div>
            <div>profesional1 / password (Profesional)</div>
            <div>recepcion / password (Recepcionista)</div>
            <hr className="my-2 border-purple-400/30" />
            <div><strong>Fallback local:</strong> admin / admin123</div>
            <div>gerente / gerente123, etc.</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;