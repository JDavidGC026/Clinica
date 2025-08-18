import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Briefcase, Search, RefreshCw, ShieldCheck } from 'lucide-react';
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
import { hasPermission, hasAnyPermission } from '@/utils/permissions';

const DisciplineManager = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [disciplineName, setDisciplineName] = useState('');
  const [disciplineDescription, setDisciplineDescription] = useState('');
  const [disciplineActive, setDisciplineActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDisciplines();
  }, []);

  useEffect(() => {
    filterDisciplines();
  }, [disciplines, searchTerm]);

  const loadDisciplines = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDisciplines();
      setDisciplines(data || []);
    } catch (error) {
      console.error('Error cargando disciplinas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las disciplinas: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDisciplines();
    setRefreshing(false);
    toast({
      title: "Actualizado",
      description: "Lista de disciplinas actualizada",
    });
  };

  const filterDisciplines = () => {
    let filtered = disciplines;
    if (searchTerm) {
      filtered = filtered.filter(discipline =>
        discipline.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredDisciplines(filtered);
  };

  const handleOpenForm = (discipline = null) => {
    setEditingDiscipline(discipline);
    setDisciplineName(discipline ? discipline.name : '');
    setDisciplineDescription(discipline ? discipline.description || '' : '');
    setDisciplineActive(discipline ? discipline.active !== 0 : true);
    setShowFormDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!disciplineName.trim()) {
      toast({ 
        title: "Error", 
        description: "El nombre de la disciplina no puede estar vacío.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setLoading(true);
      
      if (editingDiscipline) {
        // Actualizar disciplina existente
        const updateData = {
          name: disciplineName,
          description: disciplineDescription,
          active: disciplineActive ? 1 : 0
        };
        
        await apiService.updateDiscipline(editingDiscipline.id, updateData);
        toast({ 
          title: "Disciplina actualizada", 
          description: "Los cambios han sido guardados." 
        });
      } else {
        // Crear nueva disciplina
        const newDiscipline = {
          name: disciplineName,
          description: disciplineDescription,
          active: disciplineActive ? 1 : 0
        };
        
        await apiService.createDiscipline(newDiscipline);
        toast({ 
          title: "Disciplina agregada", 
          description: "La nueva disciplina ha sido registrada." 
        });
      }
      
      // Recargar disciplinas
      await loadDisciplines();
      
      // Cerrar dialog
      setShowFormDialog(false);
      setDisciplineName('');
      setDisciplineDescription('');
      setDisciplineActive(true);
      
    } catch (error) {
      console.error('Error guardando disciplina:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la disciplina: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteDiscipline = async (id) => {
    try {
      setLoading(true);
      
      // Encontrar la disciplina que se va a eliminar
      const disciplineToDelete = disciplines.find(d => d.id === id);
      const disciplineName = disciplineToDelete ? disciplineToDelete.name : id;
      
      // Eliminar del servidor y actualizar cache
      const result = await apiService.deleteDiscipline(id);
      
      // Si el resultado incluye datos frescos, actualizarlos inmediatamente
      if (result.data) {
        setDisciplines(result.data);
      } else {
        // Eliminar del estado local inmediatamente
        setDisciplines(prev => prev.filter(d => d.id !== id));
      }
      
      toast({ 
        title: "✅ Disciplina eliminada", 
        description: `${disciplineName} ha sido eliminada correctamente.`
      });
      
      // Recargar datos para asegurar sincronización
      setTimeout(() => {
        loadDisciplines();
      }, 500);
      
    } catch (error) {
      console.error('Error eliminando disciplina:', error);
      toast({
        title: "❌ Error al eliminar",
        description: error.message.includes('in use') 
          ? "No se puede eliminar la disciplina porque está asignada a uno o más profesionales."
          : "No se pudo eliminar la disciplina: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Guardas de permisos
  const canRead = hasAnyPermission(['disciplines', 'disciplines_manage'], 'read');
  const canWrite = hasPermission('disciplines_manage', 'write') || hasPermission('disciplines', 'write');

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <ShieldCheck size={64} className="text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground">No tienes permiso para ver Disciplinas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Briefcase className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Disciplinas</h1>
            <p className="text-gray-500">Administra las disciplinas médicas de la clínica</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => handleOpenForm()} disabled={!canWrite} className={!canWrite ? 'opacity-60 cursor-not-allowed' : ''}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Disciplina
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar disciplinas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Lista de disciplinas */}
      {loading && !refreshing ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-500 mt-2">Cargando disciplinas...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDisciplines.map((discipline) => (
            <motion.div
              key={discipline.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{discipline.name}</h3>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  discipline.active === 1 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {discipline.active === 1 ? 'Activa' : 'Inactiva'}
                </div>
              </div>
              
              {discipline.description && (
                <p className="text-gray-600 text-sm mb-3">{discipline.description}</p>
              )}
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenForm(discipline)}
                  disabled={!canWrite}
                  className={!canWrite ? 'opacity-60 cursor-not-allowed' : ''}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={!canWrite} className={!canWrite ? 'opacity-60 cursor-not-allowed' : ''}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente la disciplina "{discipline.name}".
                        Los profesionales asignados a esta disciplina quedarán sin asignar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteDiscipline(discipline.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Diálogo de formulario */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingDiscipline ? 'Editar Disciplina' : 'Nueva Disciplina'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                id="name"
                type="text"
                value={disciplineName}
                onChange={(e) => setDisciplineName(e.target.value)}
                placeholder="Ej: Cardiología, Neurología..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                value={disciplineDescription}
                onChange={(e) => setDisciplineDescription(e.target.value)}
                placeholder="Descripción de la disciplina médica..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="active"
                type="checkbox"
                checked={disciplineActive}
                onChange={(e) => setDisciplineActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Disciplina activa
              </label>
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !canWrite}
              className={!canWrite ? 'opacity-60 cursor-not-allowed' : ''}
            >
              {loading ? 'Guardando...' : editingDiscipline ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisciplineManager;
