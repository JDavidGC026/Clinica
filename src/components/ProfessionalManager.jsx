import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Clock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ProfessionalForm from '@/components/ProfessionalForm';
import apiService from '@/services/ApiService';

const ProfessionalManager = () => {
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessionals();
    loadDisciplines();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, searchTerm]);

  const loadDisciplines = async () => {
    try {
      const disciplinesData = await apiService.getDisciplines();
      setDisciplines(disciplinesData);
    } catch (error) {
      console.error('Error cargando disciplinas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las disciplinas.",
        variant: "destructive"
      });
    }
  };

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const professionalsData = await apiService.getProfessionals();
      setProfessionals(professionalsData);
    } catch (error) {
      console.error('Error cargando profesionales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los profesionales.",
        variant: "destructive"
      });
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProfessionals = () => {
    let filtered = professionals;

    if (searchTerm) {
      filtered = filtered.filter(prof =>
        prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (disciplines.find(d => d.id === prof.disciplineId)?.name.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        prof.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProfessionals(filtered);
  };

  const handleAddProfessional = async (data) => {
    try {
      const newProfessional = await apiService.createProfessional(data);
      setProfessionals(prev => [...prev, newProfessional]);
      setShowForm(false);
      toast({ 
        title: "Profesional agregado", 
        description: "El profesional ha sido registrado exitosamente." 
      });
    } catch (error) {
      console.error('Error creando profesional:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el profesional: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditProfessional = async (data) => {
    try {
      const updatedProfessional = await apiService.updateProfessional(editingProfessional.id, data);
      setProfessionals(prev => prev.map(p => 
        p.id === editingProfessional.id ? updatedProfessional : p
      ));
      setEditingProfessional(null);
      setShowForm(false);
      toast({ 
        title: "Profesional actualizado", 
        description: "Los cambios han sido guardados exitosamente." 
      });
    } catch (error) {
      console.error('Error actualizando profesional:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el profesional: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteProfessional = async (id) => {
    try {
      await apiService.deleteProfessional(id);
      setProfessionals(prev => prev.filter(p => p.id !== id));
      toast({ 
        title: "Profesional eliminado", 
        description: "El profesional ha sido eliminado exitosamente." 
      });
    } catch (error) {
      console.error('Error eliminando profesional:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el profesional: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getAvailableDays = (schedule) => {
    if (!schedule) return 'No disponible';
    
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return dayKeys
      .filter(day => schedule[day]?.available)
      .map(day => days[dayKeys.indexOf(day)])
      .join(', ') || 'No disponible';
  };

  const getDisciplineName = (disciplineId) => {
    return disciplines.find(d => d.id === disciplineId)?.name || 'Sin disciplina';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Profesionales</h1>
            <p className="text-muted-foreground mt-1">Cargando profesionales...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-card rounded-xl shadow-lg p-6 animate-pulse border border-border/50">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Profesionales</h1>
          <p className="text-muted-foreground mt-1">Administra el equipo de profesionales de la clínica</p>
        </div>
        <Button
          onClick={() => { setEditingProfessional(null); setShowForm(true); }}
          className="w-full sm:w-auto button-primary-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Profesional
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, disciplina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProfessionals.map((professional) => (
          <motion.div
            key={professional.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg overflow-hidden card-hover border border-border/50"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent-alt rounded-full flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-card-foreground truncate">{professional.name}</h3>
                    <p className="text-sm text-muted-foreground truncate flex items-center">
                      <Briefcase className="w-3 h-3 mr-1.5 text-muted-foreground shrink-0" />
                      {getDisciplineName(professional.disciplineId)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditingProfessional(professional); setShowForm(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteProfessional(professional.id)} className="text-destructive hover:text-destructive/90">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground truncate">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                  {professional.email}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                  {professional.phone}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Días disponibles:</p>
                <p className="text-sm text-card-foreground truncate">{getAvailableDays(professional.schedule)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProfessionals.length === 0 && !loading && (
        <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
          <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">No hay profesionales</h3>
          <p className="text-muted-foreground text-sm">
            {professionals.length === 0 ? 'Agrega tu primer profesional' : 'No se encontraron resultados'}
          </p>
        </div>
      )}

      {showForm && (
        <ProfessionalForm
          professional={editingProfessional}
          disciplines={disciplines}
          onSubmit={editingProfessional ? handleEditProfessional : handleAddProfessional}
          onCancel={() => { setShowForm(false); setEditingProfessional(null); }}
        />
      )}
    </div>
  );
};

export default ProfessionalManager;