import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PatientForm from '@/components/PatientForm';

const PatientManager = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm]);

  const loadPatients = () => {
    const saved = localStorage.getItem('clinic_patients');
    if (saved) {
      setPatients(JSON.parse(saved));
    }
  };

  const savePatients = (newPatients) => {
    localStorage.setItem('clinic_patients', JSON.stringify(newPatients));
    setPatients(newPatients);
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

  const handleAddPatient = (patientData) => {
    const newPatient = {
      id: Date.now(),
      ...patientData,
      createdAt: new Date().toISOString()
    };

    const newPatients = [...patients, newPatient];
    savePatients(newPatients);
    setShowForm(false);
    
    toast({
      title: "Paciente registrado",
      description: "El paciente ha sido agregado exitosamente.",
    });
  };

  const handleEditPatient = (patientData) => {
    const updatedPatients = patients.map(patient =>
      patient.id === editingPatient.id ? { ...patient, ...patientData } : patient
    );
    
    savePatients(updatedPatients);
    setEditingPatient(null);
    setShowForm(false);
    
    toast({
      title: "Paciente actualizado",
      description: "Los cambios han sido guardados exitosamente.",
    });
  };

  const handleDeletePatient = (id) => {
    const updatedPatients = patients.filter(patient => patient.id !== id);
    savePatients(updatedPatients);
    
    toast({
      title: "Paciente eliminado",
      description: "El paciente ha sido eliminado del sistema.",
    });
  };

  const getPatientAppointments = (patientId) => {
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    return appointments.filter(apt => apt.patientId === patientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="text-gray-600 mt-1">Administra la información de los pacientes</p>
        </div>
        <Button
          onClick={() => {
            setEditingPatient(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden card-hover"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">
                      {patient.age ? `${patient.age} años` : ''}
                      {patient.age && patient.gender ? ' - ' : ''}
                      {patient.gender}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditingPatient(patient); setShowForm(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeletePatient(patient.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600 truncate"><Mail className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{patient.email}</div>
                {patient.phone && <div className="flex items-center text-gray-600"><Phone className="w-4 h-4 mr-2 text-gray-400 shrink-0" />{patient.phone}</div>}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Citas</span>
                  <span className="font-semibold text-purple-600">
                    {getPatientAppointments(patient.id).length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pacientes</h3>
          <p className="text-gray-500 text-sm">
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