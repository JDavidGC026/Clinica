import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Award, Clock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ProfessionalForm from '@/components/ProfessionalForm'; // Cambiado de PsychologistForm

const ProfessionalManager = () => {
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    loadProfessionals();
    loadDisciplines();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, searchTerm]);

  const loadDisciplines = () => {
    const savedDisciplines = localStorage.getItem('clinic_disciplines');
    if (savedDisciplines) {
      setDisciplines(JSON.parse(savedDisciplines));
    } else {
      const defaultDisciplines = [
        { id: 'psicologia', name: 'Psicología' },
        { id: 'fisioterapia', name: 'Fisioterapia' },
        { id: 'nutricion', name: 'Nutrición' },
      ];
      localStorage.setItem('clinic_disciplines', JSON.stringify(defaultDisciplines));
      setDisciplines(defaultDisciplines);
    }
  };

  const loadProfessionals = () => {
    const saved = localStorage.getItem('clinic_professionals');
    if (saved) {
      setProfessionals(JSON.parse(saved));
    } else {
      const sampleData = [
        {
          id: 1, name: 'Dr. Ana García', email: 'ana.garcia@multiclinic.com', phone: '+34 600 123 456', disciplineId: 'psicologia', license: 'COL-12345', experience: '8 años',
          schedule: { monday: { start: '09:00', end: '17:00', available: true }, tuesday: { start: '09:00', end: '17:00', available: true }, wednesday: { start: '09:00', end: '17:00', available: true }, thursday: { start: '09:00', end: '17:00', available: true }, friday: { start: '09:00', end: '15:00', available: true }, saturday: { start: '', end: '', available: false }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        },
        {
          id: 2, name: 'Dr. Carlos Ruiz', email: 'carlos.ruiz@multiclinic.com', phone: '+34 600 789 012', disciplineId: 'fisioterapia', license: 'FIS-67890', experience: '12 años',
          schedule: { monday: { start: '10:00', end: '18:00', available: true }, tuesday: { start: '10:00', end: '18:00', available: true }, wednesday: { start: '10:00', end: '18:00', available: true }, thursday: { start: '10:00', end: '18:00', available: true }, friday: { start: '10:00', end: '16:00', available: true }, saturday: { start: '09:00', end: '13:00', available: true }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        }
      ];
      localStorage.setItem('clinic_professionals', JSON.stringify(sampleData));
      setProfessionals(sampleData);
    }
  };

  const saveProfessionals = (newProfessionals) => {
    localStorage.setItem('clinic_professionals', JSON.stringify(newProfessionals));
    setProfessionals(newProfessionals);
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

  const handleAddProfessional = (data) => {
    const newProfessional = { id: Date.now(), ...data, status: 'activo' };
    saveProfessionals([...professionals, newProfessional]);
    setShowForm(false);
    toast({ title: "Profesional agregado", description: "El profesional ha sido registrado." });
  };

  const handleEditProfessional = (data) => {
    saveProfessionals(professionals.map(p => (p.id === editingProfessional.id ? { ...p, ...data } : p)));
    setEditingProfessional(null);
    setShowForm(false);
    toast({ title: "Profesional actualizado", description: "Los cambios han sido guardados." });
  };

  const handleDeleteProfessional = (id) => {
    saveProfessionals(professionals.filter(p => p.id !== id));
    toast({ title: "Profesional eliminado", description: "El profesional ha sido eliminado." });
  };

  const getAvailableDays = (schedule) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return dayKeys.filter(day => schedule[day]?.available).map(day => days[dayKeys.indexOf(day)]).join(', ');
  };

  const getDisciplineName = (disciplineId) => {
    return disciplines.find(d => d.id === disciplineId)?.name || 'Sin disciplina';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Profesionales</h1>
          <p className="text-gray-600 mt-1">Administra el equipo de profesionales de la clínica</p>
        </div>
        <Button
          onClick={() => { setEditingProfessional(null); setShowForm(true); }}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Profesional
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, disciplina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProfessionals.map((professional) => (
          <motion.div
            key={professional.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden card-hover"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{professional.name}</h3>
                    <p className="text-sm text-gray-500 truncate flex items-center">
                      <Briefcase className="w-3 h-3 mr-1.5 text-gray-400 shrink-0" />
                      {getDisciplineName(professional.disciplineId)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditingProfessional(professional); setShowForm(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteProfessional(professional.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600 truncate"><Mail className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{professional.email}</div>
                <div className="flex items-center text-gray-600"><Phone className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{professional.phone}</div>
                <div className="flex items-center text-gray-600"><Award className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{professional.license}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Días disponibles:</p>
                <p className="text-sm text-gray-700 truncate">{getAvailableDays(professional.schedule) || 'No disponible'}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProfessionals.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay profesionales</h3>
          <p className="text-gray-500 text-sm">
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