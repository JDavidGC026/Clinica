import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Briefcase, Search, RefreshCw } from 'lucide-react';
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
      await apiService.deleteDiscipline(id);
      toast({ 
        title: "Disciplina eliminada", 
        description: "La disciplina ha sido eliminada." 
      });
      await loadDisciplines();
    } catch (error) {
      console.error('Error eliminando disciplina:', error);
      toast({
        title: "Error al eliminar",
        description: error.message.includes('in use') 
          ? "No se puede eliminar la disciplina porque está asignada a uno o más profesionales."
          : "No se pudo eliminar la disciplina: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Disciplinas</h1>
          <p className="text-muted-foreground mt-1">Crea, edita y administra las disciplinas de la clínica</p>
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
            Nueva Disciplina
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre de disciplina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDisciplines.map((discipline) => (
          <motion.div
            key={discipline.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg p-6 card-hover border border-border/50"
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <Briefcase className="w-6 h-6 mr-3 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground break-words">{discipline.name}</h3>
                    {discipline.description && (
                      <p className="text-sm text-muted-foreground mt-1">{discipline.description}</p>
                    )}
                  </div>
                </div>
                <div className="ml-9 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">ID: {discipline.id}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${discipline.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {discipline.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleOpenForm(discipline)}
                disabled={loading}
              >
                <Edit className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Editar</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="destructiveOutline" 
                    className="text-destructive hover:text-destructive/90"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Eliminar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente la disciplina "{discipline.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteDiscipline(discipline.id)} 
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

      {filteredDisciplines.length === 0 && (
        <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
          <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">No hay disciplinas</h3>
          <p className="text-muted-foreground text-sm">
            {disciplines.length === 0 
              ? 'Comienza registrando tu primera disciplina' 
              : 'No se encontraron disciplinas con los filtros aplicados'
            }
          </p>
        </div>
      )}

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{editingDiscipline ? 'Editar Disciplina' : 'Nueva Disciplina'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right col-span-1 text-muted-foreground">
                  Nombre*
                </label>
                <input
                  id="name"
                  value={disciplineName}
                  onChange={(e) => setDisciplineName(e.target.value)}
                  className="col-span-3 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Nombre de la disciplina"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right col-span-1 text-muted-foreground">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={disciplineDescription}
                  onChange={(e) => setDisciplineDescription(e.target.value)}
                  className="col-span-3 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Descripción opcional"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="active" className="text-right col-span-1 text-muted-foreground">
                  Estado
                </label>
                <div className="col-span-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disciplineActive}
                      onChange={(e) => setDisciplineActive(e.target.checked)}
                      className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                    />
                    <span className="text-sm text-foreground">Disciplina activa</span>
                  </label>
                </div>
              </div>
              {editingDiscipline && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="id" className="text-right col-span-1 text-muted-foreground">
                    ID
                  </label>
                  <input
                    id="id"
                    value={editingDiscipline.id}
                    className="col-span-3 px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                    disabled
                  />
                </div>
              )}
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
                {loading ? 'Guardando...' : (editingDiscipline ? 'Guardar Cambios' : 'Crear Disciplina')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisciplineManager;