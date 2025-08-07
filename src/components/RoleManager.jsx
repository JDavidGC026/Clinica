import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Shield, Search, RefreshCw, Tag, Users } from 'lucide-react';
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
        apiService.get('role-categories')
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
      setRoleFormData({
        name: role.name || '',
        description: role.description || '',
        category_id: role.category_id || '',
        permissions: role.permissions ? JSON.parse(role.permissions) : [],
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
        permissions: JSON.stringify(roleFormData.permissions),
        category_id: roleFormData.category_id || null
      };
      
      if (editingRole) {
        await apiService.put(`roles?id=${editingRole.id}`, submitData);
        toast({ 
          title: "Rol actualizado", 
          description: "Los cambios han sido guardados." 
        });
      } else {
        await apiService.post('roles', submitData);
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
      await apiService.delete(`roles?id=${id}`);
      toast({ 
        title: "Rol eliminado", 
        description: "El rol ha sido eliminado." 
      });
      await loadData();
    } catch (error) {
      console.error('Error eliminando rol:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el rol: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
        await apiService.put(`role-categories?id=${editingCategory.id}`, submitData);
        toast({ 
          title: "Categoría actualizada", 
          description: "Los cambios han sido guardados." 
        });
      } else {
        await apiService.post('role-categories', submitData);
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
      await apiService.delete(`role-categories?id=${id}`);
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/90">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará la categoría "{category.name}". Los roles asignados perderán su categoría.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                      {JSON.parse(role.permissions).map((permission) => {
                        const permissionData = availablePermissions.find(p => p.id === permission);
                        return (
                          <span key={permission} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                            {permissionData?.name || permission}
                          </span>
                        );
                      })}
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
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:text-destructive/90"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> 
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el rol "{role.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteRole(role.id)} 
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
                
                <div>
                  <label htmlFor="role-category" className="block text-sm font-medium text-muted-foreground mb-1">
                    Categoría
                  </label>
                  <select
                    id="role-category"
                    name="category_id"
                    value={roleFormData.category_id}
                    onChange={handleRoleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.filter(c => c.active).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
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
