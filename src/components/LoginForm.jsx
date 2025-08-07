import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const LoginForm = ({ onLogin, isLoading }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    onLogin(formData);
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
      className="w-full max-w-lg"
    >
      <div className="glass-effect rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="w-[250px] h-[200px] bg-white/10 rounded-xl mx-auto mb-4 flex items-center justify-center p-2"
          >
            <img 
              src="/logo.jpeg" 
              alt="Logo Delux" 
            className="w-full h-full rounded-xl object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-full items-center justify-center" style={{display: 'none'}}>
              <Lock className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Clínica Delux</h1>
          <p className="text-purple-200">Sistema de Gestión Médica</p>
          <p className="text-purple-300 text-sm mt-2">🇲🇽 Ciudad de México, México</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Usuario / Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Usuario o email del profesional"
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
            <div><strong>Admin:</strong> admin / admin123</div>
            <div><strong>Gerente:</strong> gerente / gerente123</div>
            <div><strong>Profesional:</strong> profesional1 / prof123</div>
            <div><strong>Recepción:</strong> recepcion / recep123</div>
            <hr className="my-2 border-purple-400/30" />
            <div className="text-green-300">
              <strong>Profesionales:</strong> Usa tu email y contraseña asignada
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;