import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, Search, RefreshCw, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import apiService from '@/services/ApiService';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [paginatedUsers, setPaginatedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(12);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'Usuario',
    role_id: '',
    active: true
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  useEffect(() => {
    paginateUsers();
  }, [filteredUsers, currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await apiService.get('roles.php');
      setRoles(data || []);
    } catch (error) {
      console.error('Error cargando roles:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUsers(), loadRoles()]);
    setRefreshing(false);
    toast({
      title: "Actualizado",
      description: "Lista de usuarios actualizada",
    });
  };

  const filterUsers = () => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role_name && user.role_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const paginateUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  };

  const getTotalPages = () => {
    return Math.ceil(filteredUsers.length / usersPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenForm = (user = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        name: user.name,
        role: user.role,
        role_id: user.role_id || '',
        active: user.active === 1
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        name: '',
        role: 'Usuario',
        role_id: '',
        active: true
      });
    }
    setShowFormDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.username.trim() || !formData.email.trim() || !formData.name.trim()) {
      toast({ 
        title: "Error", 
        description: "Todos los campos marcados con * son requeridos.", 
        variant: "destructive" 
      });
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast({ 
        title: "Error", 
        description: "La contraseña es requerida para nuevos usuarios.", 
        variant: "destructive" 
      });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast({ 
        title: "Error", 
        description: "La contraseña debe tener al menos 6 caracteres.", 
        variant: "destructive" 
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ 
        title: "Error", 
        description: "Ingrese un email válido.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        active: formData.active ? 1 : 0,
        role_id: formData.role_id || null
      };

      // Si estamos editando y la contraseña está vacía, no la incluir
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }
      
      if (editingUser) {
        await apiService.put(`users.php?id=${editingUser.id}`, submitData);
        toast({ 
          title: "Usuario actualizado", 
          description: "Los cambios han sido guardados." 
        });
      } else {
        await apiService.post('users.php', submitData);
        toast({ 
          title: "Usuario creado", 
          description: "El nuevo usuario ha sido registrado." 
        });
      }
      
      await loadUsers();
      setShowFormDialog(false);
      
    } catch (error) {
      console.error('Error guardando usuario:', error);
      toast({
        title: "Error",
        description: error.message.includes('already exists') 
          ? "El usuario o email ya existe."
          : "No se pudo guardar el usuario: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      setLoading(true);
      await apiService.delete(`users.php?id=${id}`);
      toast({ 
        title: "Usuario eliminado", 
        description: "El usuario ha sido eliminado." 
      });
      await loadUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      toast({
        title: "Error al eliminar",
        description: error.message.includes('last administrator') 
          ? "No se puede eliminar el último administrador."
          : "No se pudo eliminar el usuario: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getRoleDisplayName = (user) => {
    return user.role_name || user.role || 'Sin rol';
  };

  const getStatusBadge = (active) => {
    return active 
      ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>
      : <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactivo</span>;
  };

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Crea, edita y administra los usuarios del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button
            onClick={() => handleOpenForm()}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent-alt hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg p-6 card-hover border border-border/50"
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  <h3 className="text-lg font-semibold text-card-foreground break-words">{user.name}</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <strong>Usuario:</strong> {user.username}
                  </p>
                  <p className="text-muted-foreground break-all">
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Rol:</strong> {getRoleDisplayName(user)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(user.active)}
                    <span className="text-xs text-muted-foreground">
                      ID: {user.id}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleOpenForm(user)}
                  disabled={loading}
                >
                  <Edit className="w-4 h-4 mr-1 sm:mr-2" /> 
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="destructiveOutline" 
                      className="text-destructive hover:text-destructive/90"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-1 sm:mr-2" /> 
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el usuario "{user.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={loading}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">No hay usuarios</h3>
          <p className="text-muted-foreground text-sm">
            {users.length === 0 
              ? 'Comienza registrando tu primer usuario' 
              : 'No se encontraron usuarios con los filtros aplicados'
            }
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {getTotalPages() > 1 && (
        <div className="bg-card rounded-xl shadow-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * usersPerPage + 1} - {Math.min(currentPage * usersPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              
              {Array.from({ length: getTotalPages() }, (_, i) => i + 1)
                .filter(page => {
                  const totalPages = getTotalPages();
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (page >= currentPage - 2 && page <= currentPage + 2) return true;
                  return false;
                })
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === getTotalPages()}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                    Nombre completo *
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-1">
                    Usuario *
                  </label>
                  <input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Nombre de usuario"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
                  Contraseña {!editingUser && '*'}
                  {editingUser && <span className="text-xs text-muted-foreground ml-1">(dejar vacío para no cambiar)</span>}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Mínimo 6 caracteres"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role_id" className="block text-sm font-medium text-muted-foreground mb-1">
                    Rol del sistema
                  </label>
                  <select
                    id="role_id"
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="">Seleccionar rol...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-1">
                    Rol personalizado
                  </label>
                  <input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Rol personalizado"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                  />
                  <span className="text-sm text-foreground">Usuario activo</span>
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-primary to-accent-alt hover:opacity-90"
                disabled={loading}
              >
                {loading ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManager;
