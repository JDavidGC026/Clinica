import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PsychologistForm from '@/components/PsychologistForm';

const PsychologistManager = () => {
  const [psychologists, setPsychologists] = useState([]);
  const [filteredPsychologists, setFilteredPsychologists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPsychologist, setEditingPsychologist] = useState(null);

  useEffect(() => {
    loadPsychologists();
  }, []);

  useEffect(() => {
    filterPsychologists();
  }, [psychologists, searchTerm]);

  const loadPsychologists = () => {
    const saved = localStorage.getItem('clinic_psychologists');
    if (saved) {
      setPsychologists(JSON.parse(saved));
    } else {
      const sampleData = [
        {
          id: 1, name: 'Dr. Ana García', email: 'ana.garcia@psicoclinic.com', phone: '+34 600 123 456', specialty: 'Terapia Cognitivo-Conductual', license: 'COL-12345', experience: '8 años',
          schedule: { monday: { start: '09:00', end: '17:00', available: true }, tuesday: { start: '09:00', end: '17:00', available: true }, wednesday: { start: '09:00', end: '17:00', available: true }, thursday: { start: '09:00', end: '17:00', available: true }, friday: { start: '09:00', end: '15:00', available: true }, saturday: { start: '', end: '', available: false }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        },
        {
          id: 2, name: 'Dr. Carlos Ruiz', email: 'carlos.ruiz@psicoclinic.com', phone: '+34 600 789 012', specialty: 'Psicología Infantil', license: 'COL-67890', experience: '12 años',
          schedule: { monday: { start: '10:00', end: '18:00', available: true }, tuesday: { start: '10:00', end: '18:00', available: true }, wednesday: { start: '10:00', end: '18:00', available: true }, thursday: { start: '10:00', end: '18:00', available: true }, friday: { start: '10:00', end: '16:00', available: true }, saturday: { start: '09:00', end: '13:00', available: true }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        }
      ];
      localStorage.setItem('clinic_psychologists', JSON.stringify(sampleData));
      setPsychologists(sampleData);
    }
  };

  const savePsychologists = (newPsychologists) => {
    localStorage.setItem('clinic_psychologists', JSON.stringify(newPsychologists));
    setPsychologists(newPsychologists);
  };

  const filterPsychologists = () => {
    let filtered = psychologists;

    if (searchTerm) {
      filtered = filtered.filter(psy =>
        psy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        psy.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        psy.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPsychologists(filtered);
  };

  const handleAddPsychologist = (data) => {
    const newPsychologist = { id: Date.now(), ...data, status: 'activo' };
    savePsychologists([...psychologists, newPsychologist]);
    setShowForm(false);
    toast({ title: "Psicólogo agregado", description: "El psicólogo ha sido registrado." });
  };

  const handleEditPsychologist = (data) => {
    savePsychologists(psychologists.map(p => (p.id === editingPsychologist.id ? { ...p, ...data } : p)));
    setEditingPsychologist(null);
    setShowForm(false);
    toast({ title: "Psicólogo actualizado", description: "Los cambios han sido guardados." });
  };

  const handleDeletePsychologist = (id) => {
    savePsychologists(psychologists.filter(p => p.id !== id));
    toast({ title: "Psicólogo eliminado", description: "El psicólogo ha sido eliminado." });
  };

  const getAvailableDays = (schedule) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return dayKeys.filter(day => schedule[day]?.available).map(day => days[dayKeys.indexOf(day)]).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Psicólogos</h1>
          <p className="text-gray-600 mt-1">Administra el equipo de profesionales</p>
        </div>
        <Button
          onClick={() => { setEditingPsychologist(null); setShowForm(true); }}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Psicólogo
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPsychologists.map((psychologist) => (
          <motion.div
            key={psychologist.id}
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
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{psychologist.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{psychologist.specialty}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditingPsychologist(psychologist); setShowForm(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeletePsychologist(psychologist.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600 truncate"><Mail className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{psychologist.email}</div>
                <div className="flex items-center text-gray-600"><Phone className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{psychologist.phone}</div>
                <div className="flex items-center text-gray-600"><Award className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{psychologist.license}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Días disponibles:</p>
                <p className="text-sm text-gray-700 truncate">{getAvailableDays(psychologist.schedule) || 'No disponible'}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPsychologists.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay psicólogos</h3>
          <p className="text-gray-500 text-sm">
            {psychologists.length === 0 ? 'Agrega tu primer psicólogo' : 'No se encontraron resultados'}
          </p>
        </div>
      )}

      {showForm && (
        <PsychologistForm
          psychologist={editingPsychologist}
          onSubmit={editingPsychologist ? handleEditPsychologist : handleAddPsychologist}
          onCancel={() => { setShowForm(false); setEditingPsychologist(null); }}
        />
      )}
    </div>
  );
};

export default PsychologistManager;