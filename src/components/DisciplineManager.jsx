import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Briefcase, Search } from 'lucide-react';
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

const initialDisciplines = [
  { id: 'medicina-general', name: 'Medicina General' },
  { id: 'pediatria', name: 'Pediatría' },
  { id: 'ginecologia', name: 'Ginecología' },
  { id: 'traumatologia-ortopedia', name: 'Traumatología y Ortopedia' },
  { id: 'urologia', name: 'Urología' },
  { id: 'medicina-interna', name: 'Medicina Interna' },
  { id: 'gastroenterologia', name: 'Gastroenterología' },
  { id: 'nutricion', name: 'Nutrición' },
  { id: 'dermatologia', name: 'Dermatología' },
  { id: 'psicologia-clinica', name: 'Psicología Clínica' },
];


const DisciplineManager = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [disciplineName, setDisciplineName] = useState('');
  const [disciplineId, setDisciplineId] = useState('');

  useEffect(() => {
    loadDisciplines();
  }, []);

  useEffect(() => {
    filterDisciplines();
  }, [disciplines, searchTerm]);

  const loadDisciplines = () => {
    const saved = localStorage.getItem('clinic_disciplines');
    if (saved) {
      setDisciplines(JSON.parse(saved));
    } else {
      localStorage.setItem('clinic_disciplines', JSON.stringify(initialDisciplines));
      setDisciplines(initialDisciplines);
    }
  };

  const saveDisciplines = (newDisciplines) => {
    localStorage.setItem('clinic_disciplines', JSON.stringify(newDisciplines));
    setDisciplines(newDisciplines);
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
    setDisciplineId(discipline ? discipline.id : '');
    setShowFormDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disciplineName.trim()) {
      toast({ title: "Error", description: "El nombre de la disciplina no puede estar vacío.", variant: "destructive" });
      return;
    }

    if (editingDiscipline) {
      const updatedDisciplines = disciplines.map(d =>
        d.id === editingDiscipline.id ? { ...d, name: disciplineName } : d
      );
      saveDisciplines(updatedDisciplines);
      toast({ title: "Disciplina actualizada", description: "Los cambios han sido guardados." });
    } else {
      const newId = disciplineName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      const newDiscipline = { id: newId, name: disciplineName };
      saveDisciplines([...disciplines, newDiscipline]);
      toast({ title: "Disciplina agregada", description: "La nueva disciplina ha sido registrada." });
    }
    setShowFormDialog(false);
    setDisciplineName('');
    setDisciplineId('');
  };

  const handleDeleteDiscipline = (id) => {
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const isDisciplineInUse = professionals.some(prof => prof.disciplineId === id);

    if (isDisciplineInUse) {
      toast({
        title: "Error al eliminar",
        description: "No se puede eliminar la disciplina porque está asignada a uno o más profesionales.",
        variant: "destructive",
      });
      return;
    }

    saveDisciplines(disciplines.filter(d => d.id !== id));
    toast({ title: "Disciplina eliminada", description: "La disciplina ha sido eliminada." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Disciplinas</h1>
          <p className="text-muted-foreground mt-1">Administra las especialidades médicas de la clínica</p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent-alt hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Disciplina
        </Button>
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
            className="bg-card rounded-xl shadow-lg p-6 card-hover flex flex-col justify-between border border-border/50"
          >
            <div>
              <div className="flex items-center mb-3">
                <Briefcase className="w-6 h-6 mr-3 text-primary" />
                <h3 className="text-lg font-semibold text-card-foreground truncate">{discipline.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">ID: {discipline.id}</p>
            </div>
            <div className="mt-4 flex space-x-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => handleOpenForm(discipline)}>
                <Edit className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Editar</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructiveOutline" className="text-destructive hover:text-destructive/90">
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
                    <AlertDialogAction onClick={() => handleDeleteDiscipline(discipline.id)} className="bg-destructive hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                  Nombre
                </label>
                <input
                  id="name"
                  value={disciplineName}
                  onChange={(e) => setDisciplineName(e.target.value)}
                  className="col-span-3 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  required
                />
              </div>
              {editingDiscipline && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="id" className="text-right col-span-1 text-muted-foreground">
                    ID
                  </label>
                  <input
                    id="id"
                    value={disciplineId}
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
              <Button type="submit" className="bg-gradient-to-r from-primary to-accent-alt hover:opacity-90">
                {editingDiscipline ? 'Guardar Cambios' : 'Crear Disciplina'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisciplineManager;