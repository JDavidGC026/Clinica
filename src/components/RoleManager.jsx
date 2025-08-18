import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Shield, Search, RefreshCw, Tag, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
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

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  // Estados para el modal de reasignación de usuarios
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [usersToReassign, setUsersToReassign] = useState([]);
  const [userReassignments, setUserReassignments] = useState({});
  const [reassignLoading, setReassignLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form data for roles
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    permissions: [],
    active: true
  });

  // Form data for categories
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    active: true
  });

  // Available permissions
  const availablePermissions = [
    { id: 'users_manage', name: 'Gestionar Usuarios', description: 'Crear, editar y eliminar usuarios' },
    { id: 'roles_manage', name: 'Gestionar Roles', description: 'Crear, editar y eliminar roles' },
    { id: 'patients_manage', name: 'Gestionar Pacientes', description: 'Crear, editar y eliminar pacientes' },
    { id: 'professionals_manage', name: 'Gestionar Profesionales', description: 'Crear, editar y eliminar profesionales' },
    { id: 'appointments_manage', name: 'Gestionar Citas', description: 'Crear, editar y eliminar citas' },
    { id: 'disciplines_manage', name: 'Gestionar Disciplinas', description: 'Crear, editar y eliminar disciplinas' },
    { id: 'reports_view', name: 'Ver Reportes', description: 'Acceder a reportes y estadísticas' },
    { id: 'settings_manage', name: 'Configuración', description: 'Acceder y modificar configuración del sistema' },
    { id: 'clinical_notes_manage', name: 'Notas Clínicas', description: 'Crear y editar notas clínicas' },
    { id: 'prescriptions_manage', name: 'Recetas Médicas', description: 'Generar y gestionar recetas' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRoles();
  }, [roles, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, categoriesData] = await Promise.all([
        apiService.getRoles(),
        apiService.get('role-categories.php')
      ]);
      setRoles(rolesData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Actualizado",
      description: "Datos actualizados correctamente",
    });
  };

  const filterRoles = () => {
    let filtered = roles;
    if (searchTerm) {
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.category_name && role.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredRoles(filtered);
  };

  // Role management functions
  const handleOpenRoleForm = (role = null) => {
    setEditingRole(role);
    if (role) {
      // Normalizar permisos: pueden venir como objeto {modulo: nivel}, como array o como string JSON
      let normalizedPermissions = [];
      if (role.permissions) {
        if (Array.isArray(role.permissions)) {
          normalizedPermissions = role.permissions;
        } else if (typeof role.permissions === 'string') {
          try {
            const parsed = JSON.parse(role.permissions);
            normalizedPermissions = Array.isArray(parsed) ? parsed : Object.keys(parsed || {});
          } catch (e) {
            normalizedPermissions = [];
          }
        } else if (typeof role.permissions === 'object') {
          normalizedPermissions = Object.keys(role.permissions);
        }
      }

      setRoleFormData({
        name: role.name || '',
        description: role.description || '',
        category_id: role.category_id || '',
        permissions: normalizedPermissions,
        active: role.active !== 0
      });
    } else {
      setRoleFormData({
        name: '',
        description: '',
        category_id: '',
        permissions: [],
        active: true
      });
    }
    setShowRoleDialog(true);
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    
    if (!roleFormData.name.trim()) {
      toast({ 
        title: "Error", 
        description: "El nombre del rol es requerido.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...roleFormData,
        active: roleFormData.active ? 1 : 0,
        permissions: roleFormData.permissions // Enviar como array directo
        // category_id eliminado: no se usa
      };
      
      if (editingRole) {
        await apiService.put(`roles.php?id=${editingRole.id}`, submitData);
        toast({ 
          title: "Rol actualizado", 
          description: "Los cambios han sido guardados." 
        });
      } else {
        await apiService.post('roles.php', submitData);
        toast({ 
          title: "Rol creado", 
          description: "El nuevo rol ha sido registrado." 
        });
      }
      
      await loadData();
      setShowRoleDialog(false);
      
    } catch (error) {
      console.error('Error guardando rol:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el rol: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    try {
      setLoading(true);
      
      // Obtener información del rol
      const role = roles.find(r => r.id === id);
      if (!role) {
        toast({
          title: "Error",
          description: "No se pudo encontrar el rol a eliminar.",
          variant: "destructive",
        });
        return;
      }
      
      // PASO 1: Verificar usuarios asignados a este rol
      const allUsers = await apiService.get("users.php");
      const usersWithThisRole = allUsers.filter(user => user.role === role.name);
      
      if (usersWithThisRole.length > 0) {
        // CASO A: Hay usuarios asignados → Mostrar modal de reasignación
        setRoleToDelete(role);
        setUsersToReassign(usersWithThisRole);
        // Inicializar asignaciones vacías
        const initialAssignments = {};
        usersWithThisRole.forEach(user => {
          initialAssignments[user.id] = "";
        });
        setUserReassignments(initialAssignments);
        setShowReassignModal(true);
      } else {
        // CASO B: No hay usuarios asignados → Confirmar eliminación simple
        const confirmed = window.confirm(
          `¿Estás seguro de que deseas eliminar el rol "${role.name}"?\n\n` +
          `Esta acción no se puede deshacer.`
        );
        
        if (confirmed) {
          await performRoleDeletion(role, []);
        }
      }
    } catch (error) {
      console.error("Error preparando eliminación de rol:", error);
      toast({
        title: "Error",
        description: "Error al preparar la eliminación: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Función para realizar la eliminación del rol
  const performRoleDeletion = async (role, usersToReassign) => {
    try {
      await apiService.delete(`roles.php?id=${role.id}`);
      toast({ 
        title: "✅ Rol eliminado", 
        description: usersToReassign.length > 0 
          ? `El rol "${role.name}" ha sido eliminado y ${usersToReassign.length} usuario(s) han sido reasignados.`
          : `El rol "${role.name}" ha sido eliminado correctamente.`
      });
      await loadData();
    } catch (error) {
      console.error("Error eliminando rol:", error);
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("assigned") || errorMessage.includes("in use") || errorMessage.includes("user")) {
        toast({
          title: "⚠️ Rol en uso",
          description: "No se puede eliminar este rol porque aún está asignado a usuarios.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar el rol: " + error.message,
          variant: "destructive",
        });
      }
    }
  };
  
  // Función para manejar el cambio de asignación de rol para un usuario
  const handleUserReassignment = (userId, newRoleId) => {
    setUserReassignments(prev => ({
      ...prev,
      [userId]: newRoleId
    }));
  };
  
  // Función para proceder con la reasignación y eliminación
  const handleProceedWithReassignment = async () => {
    try {
      setReassignLoading(true);
      
      // Verificar que todos los usuarios tengan un rol asignado
        const unassignedUsers = usersToReassign.filter(user => !userReassignments[user.id]);
        if (unassignedUsers.length > 0) {
        toast({
          title: "Selección incompleta",
          description: `Debes seleccionar un nuevo rol para todos los usuarios. Faltan: ${unassignedUsers.length} usuario(s).`,
          variant: "destructive",
        });
        return;
      }
      
      // Reasignar cada usuario
      const reassignmentPromises = usersToReassign.map(user => {
        const newRoleId = userReassignments[user.id];
        return apiService.put(`users.php?id=${user.id}`, {
          role_id: newRoleId
        });
      });
      
      await Promise.all(reassignmentPromises);
      
      // Ahora eliminar el rol
      await performRoleDeletion(roleToDelete, usersToReassign);
      
      // Cerrar modal
      handleCancelReassignment();
      
    } catch (error) {
      console.error("Error en la reasignación:", error);
      toast({
        title: "Error en la reasignación",
        description: "No se pudo completar la reasignación: " + error.message,
        variant: "destructive",
      });
    } finally {
      setReassignLoading(false);
    }
  };
  
  // Función para cancelar la reasignación
  const handleCancelReassignment = () => {
    setShowReassignModal(false);
    setRoleToDelete(null);
    setUsersToReassign([]);
    setUserReassignments({});
    toast({
      title: "Eliminación cancelada",
      description: "El rol no ha sido eliminado.",
    });
  };


  // Category management functions
  const handleOpenCategoryForm = (category = null) => {
    setEditingCategory(category);
    if (category) {
      setCategoryFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#3B82F6',
        active: category.active !== 0
      });
    } else {
      setCategoryFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        active: true
      });
    }
    setShowCategoryDialog(true);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    
    if (!categoryFormData.name.trim()) {
      toast({ 
        title: "Error", 
        description: "El nombre de la categoría es requerido.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...categoryFormData,
        active: categoryFormData.active ? 1 : 0
      };
      
      if (editingCategory) {
        await apiService.put(`role-categories.php?id=${editingCategory.id}`, submitData);
        toast({ 
          title: "Categoría actualizada", 
          description: "Los cambios han sido guardados." 
        });
      } else {
        await apiService.post('role-categories.php', submitData);
        toast({ 
          title: "Categoría creada", 
          description: "La nueva categoría ha sido registrada." 
        });
      }
      
      await loadData();
      setShowCategoryDialog(false);
      
    } catch (error) {
      console.error('Error guardando categoría:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la categoría: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      setLoading(true);
      await apiService.delete(`role-categories.php?id=${id}`);
      toast({ 
        title: "Categoría eliminada", 
        description: "La categoría ha sido eliminada." 
      });
      await loadData();
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la categoría: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoleFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePermissionToggle = (permissionId) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6B7280';
  };

  const getStatusBadge = (active) => {
    return active 
      ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>
      : <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactivo</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Roles</h1>
          <p className="text-muted-foreground mt-1">Administra roles, categorías y permisos del sistema</p>
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
            onClick={() => handleOpenCategoryForm()}
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Tag className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
          <Button
            onClick={() => handleOpenRoleForm()}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent-alt hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Rol
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          />
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
          <Tag className="w-5 h-5 mr-2 text-primary" />
          Categorías de Roles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/30 rounded-lg p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <h3 className="font-semibold text-card-foreground">{category.name}</h3>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleOpenCategoryForm(category)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                {getStatusBadge(category.active)}
                <span className="text-xs text-muted-foreground">
                  ID: {category.id}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Roles Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoles.map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg p-6 border border-border/50"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  <h3 className="text-lg font-semibold text-card-foreground break-words">{role.name}</h3>
                </div>
                {role.description && (
                  <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(role.category_id) }}
                  ></div>
                  <span className="text-sm text-muted-foreground">
                    {getCategoryName(role.category_id)}
                  </span>
                  {getStatusBadge(role.active)}
                </div>
                {role.permissions && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Permisos:</p>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        // Normalizar lista de permisos para mostrar etiquetas
                        let perms = [];
                        if (Array.isArray(role.permissions)) {
                          perms = role.permissions;
                        } else if (typeof role.permissions === 'string') {
                          try {
                            const parsed = JSON.parse(role.permissions);
                            perms = Array.isArray(parsed) ? parsed : Object.keys(parsed || {});
                          } catch (e) {
                            perms = [];
                          }
                        } else if (typeof role.permissions === 'object') {
                          perms = Object.keys(role.permissions);
                        }
                        return perms.map((permission) => {
                          const permissionData = availablePermissions.find(p => p.id === permission);
                          return (
                            <span key={permission} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              {permissionData?.name || permission}
                            </span>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleOpenRoleForm(role)}
                  disabled={loading}
                >
                  <Edit className="w-4 h-4 mr-1" /> 
                  Editar
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteRole(role.id)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
          <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">No hay roles</h3>
          <p className="text-muted-foreground text-sm">
            {roles.length === 0 
              ? 'Comienza creando tu primer rol' 
              : 'No se encontraron roles con los filtros aplicados'
            }
          </p>
        </div>
      )}

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitRole}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role-name" className="block text-sm font-medium text-muted-foreground mb-1">
                    Nombre del rol *
                  </label>
                  <input
                    id="role-name"
                    name="name"
                    value={roleFormData.name}
                    onChange={handleRoleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Ej: Administrador"
                    required
                  />
                </div>
                
                {/* Categoría eliminada: no se requiere para crear/editar roles */}
              </div>
              
              <div>
                <label htmlFor="role-description" className="block text-sm font-medium text-muted-foreground mb-1">
                  Descripción
                </label>
                <textarea
                  id="role-description"
                  name="description"
                  value={roleFormData.description}
                  onChange={handleRoleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Descripción del rol..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Permisos del rol
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 border border-input rounded-lg bg-muted/10">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-muted/20 rounded">
                      <input
                        type="checkbox"
                        checked={roleFormData.permissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mt-0.5 w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{permission.name}</div>
                        <div className="text-xs text-muted-foreground">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={roleFormData.active}
                    onChange={handleRoleInputChange}
                    className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                  />
                  <span className="text-sm text-foreground">Rol activo</span>
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
                {loading ? 'Guardando...' : (editingRole ? 'Guardar Cambios' : 'Crear Rol')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Reasignación de Usuarios */}
      <Dialog open={showReassignModal} onOpenChange={setShowReassignModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Reasignar usuarios antes de eliminar rol
            </DialogTitle>
            <DialogDescription>
              El rol "{roleToDelete?.name}" está asignado a {usersToReassign.length} usuario(s). 
              Debes reasignar cada usuario a un nuevo rol antes de poder eliminarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Lista de usuarios para reasignar */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Usuarios a reasignar:</h4>
              {usersToReassign.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex-1">
                    <div className="font-medium">{user.name || user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      @{user.username} • {user.email}
                    </div>
                  </div>
                  <div className="flex-1">
                    <select
                      value={userReassignments[user.id] || ""}
                      onChange={(e) => handleUserReassignment(user.id, e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="">-- Seleccionar nuevo rol --</option>
                      {roles
                        .filter(role => role.id !== roleToDelete?.id && role.active === 1)
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} {role.category_name && `(${role.category_name})`}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de la acción */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-800">¿Qué sucederá?</h4>
                  <div className="text-sm text-orange-700 mt-2 space-y-1">
                    <p>• Los {usersToReassign.length} usuario(s) serán reasignados a los roles seleccionados</p>
                    <p>• El rol "{roleToDelete?.name}" será eliminado permanentemente</p>
                    <p>• Los permisos de los usuarios cambiarán según su nuevo rol</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelReassignment}
              disabled={reassignLoading}
            >
              Cancelar eliminación
            </Button>
            <Button
              onClick={handleProceedWithReassignment}
              disabled={reassignLoading || usersToReassign.some(user => !userReassignments[user.id])}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {reassignLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Reasignar y eliminar rol
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitCategory}>
            <div className="grid gap-4 py-4">
              <div>
                <label htmlFor="category-name" className="block text-sm font-medium text-muted-foreground mb-1">
                  Nombre de la categoría *
                </label>
                <input
                  id="category-name"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Ej: Administrativo"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category-description" className="block text-sm font-medium text-muted-foreground mb-1">
                  Descripción
                </label>
                <textarea
                  id="category-description"
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Descripción de la categoría..."
                />
              </div>

              <div>
                <label htmlFor="category-color" className="block text-sm font-medium text-muted-foreground mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="category-color"
                    name="color"
                    type="color"
                    value={categoryFormData.color}
                    onChange={handleCategoryInputChange}
                    className="w-12 h-10 border border-input rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color"
                    value={categoryFormData.color}
                    onChange={handleCategoryInputChange}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={categoryFormData.active}
                    onChange={handleCategoryInputChange}
                    className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                  />
                  <span className="text-sm text-foreground">Categoría activa</span>
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
                {loading ? 'Guardando...' : (editingCategory ? 'Guardar Cambios' : 'Crear Categoría')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default RoleManager;
