import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PatientForm from '@/components/PatientForm';
import apiService from '@/services/ApiService';

const PatientManager = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientsData = await apiService.getPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pacientes.",
        variant: "destructive"
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone && patient.phone.includes(searchTerm))
      );
    }

    setFilteredPatients(filtered);
  };

  const handleAddPatient = async (patientData) => {
    try {
      const newPatient = await apiService.createPatient(patientData);
      setPatients(prev => [...prev, newPatient]);
      setShowForm(false);
      
      toast({
        title: "Paciente registrado",
        description: "El paciente ha sido agregado exitosamente.",
      });
    } catch (error) {
      console.error('Error creando paciente:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el paciente: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditPatient = async (patientData) => {
    try {
      const updatedPatient = await apiService.updatePatient(editingPatient.id, patientData);
      setPatients(prev => prev.map(patient =>
        patient.id === editingPatient.id ? updatedPatient : patient
      ));
      setEditingPatient(null);
      setShowForm(false);
      
      toast({
        title: "Paciente actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paciente: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeletePatient = async (id) => {
    try {
      await apiService.deletePatient(id);
      setPatients(prev => prev.filter(patient => patient.id !== id));
      
      toast({
        title: "Paciente eliminado",
        description: "El paciente ha sido eliminado del sistema.",
      });
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paciente: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getPatientAppointments = async (patientId) => {
    try {
      const appointments = await apiService.getAppointments();
      return appointments.filter(apt => apt.patientId === patientId);
    } catch (error) {
      console.error('Error cargando citas del paciente:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Pacientes</h1>
            <p className="text-muted-foreground mt-1">Cargando pacientes...</p>
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
    <div className="space-y-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Pacientes</h1>
          <p className="text-muted-foreground mt-1">Administra los registros de pacientes de la clínica</p>
        </div>
        <Button
          onClick={() => {
            setEditingPatient(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto button-primary-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg overflow-hidden card-hover border border-border/50"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground break-words">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {patient.age ? `${patient.age} años` : ''}
                      {patient.age && patient.gender ? ' - ' : ''}
                      {patient.gender}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditingPatient(patient); setShowForm(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeletePatient(patient.id)} className="text-destructive hover:text-destructive/90">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground truncate">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                  {patient.email}
                </div>
                {patient.phone && (
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                    {patient.phone}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Registrado</span>
                  <span className="font-semibold text-primary">
                    {new Date(patient.created_at || patient.createdAt || Date.now()).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPatients.length === 0 && !loading && (
        <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
          <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">No hay pacientes</h3>
          <p className="text-muted-foreground text-sm">
            {patients.length === 0 
              ? 'Comienza registrando tu primer paciente' 
              : 'No se encontraron pacientes con los filtros aplicados'
            }
          </p>
        </div>
      )}

      {showForm && (
        <PatientForm
          patient={editingPatient}
          onSubmit={editingPatient ? handleEditPatient : handleAddPatient}
          onCancel={() => { setShowForm(false); setEditingPatient(null); }}
        />
      )}
    </div>
  );
};

export default PatientManager;