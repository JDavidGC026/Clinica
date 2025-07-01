import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Calendar, FileText, Edit2, PlusCircle, Download, ChevronLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import apiService from '@/services/ApiService';

const ProfessionalPortal = ({ currentUser }) => {
  const [patients, setPatients] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({ 
    medications: [{ name: '', dosage: '', instructions: '' }], 
    generalObservations: '' 
  });
  const [clinicName, setClinicName] = useState("Grupo Médico Delux");
  const [professionalDetails, setProfessionalDetails] = useState(null);
  const [clinicLogo, setClinicLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filteredPatients, setFilteredPatients] = useState([]);

  useEffect(() => {
    const storedClinicName = localStorage.getItem('clinic_name');
    if (storedClinicName) {
      setClinicName(storedClinicName);
    }
    const storedLogo = localStorage.getItem('clinic_logo_base64');
    if (storedLogo) {
      setClinicLogo(storedLogo);
    }

    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm]);

  const loadData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Cargar profesionales para encontrar el actual
      const allProfessionals = await apiService.getProfessionals();
      console.log("Profesionales cargados:", allProfessionals);
      
      // Buscar el profesional actual con múltiples criterios
      let currentProfDetails = null;
      
      if (currentUser.type === 'professional') {
        // Si es login como profesional, buscar por email o ID
        currentProfDetails = allProfessionals.find(p => 
          p.email === currentUser.email || 
          p.id.toString() === currentUser.id.toString()
        );
      } else {
        // Si es usuario normal, buscar por nombre o email
        currentProfDetails = allProfessionals.find(p => 
          p.name === currentUser.name || 
          p.email === currentUser.email
        );
      }
      
      console.log("Profesional actual encontrado:", currentProfDetails);
      setProfessionalDetails(currentProfDetails);
      
      if (!currentProfDetails) {
        console.warn("No se encontró el profesional actual");
        toast({
          title: "Información",
          description: "No se encontró información del profesional. Contacta al administrador.",
          variant: "default"
        });
        setLoading(false);
        return;
      }
      
      // Cargar citas
      const loadedAppointments = await apiService.getAppointments();
      console.log("Citas cargadas:", loadedAppointments);
      setAllAppointments(loadedAppointments);

      // Filtrar citas del profesional actual con múltiples criterios
      const professionalAppointments = loadedAppointments.filter(
        (apt) => {
          // Buscar por ID del profesional
          const matchById = apt.professional_id && 
            apt.professional_id.toString() === currentProfDetails.id.toString();
          
          // Buscar por nombre del profesional (exacto y parcial)
          const matchByName = apt.professional_name && (
            apt.professional_name === currentProfDetails.name ||
            apt.professional_name.includes(currentProfDetails.name.split(' ')[0]) ||
            currentProfDetails.name.includes(apt.professional_name.split(' ')[0])
          );
          
          // Buscar por email
          const matchByEmail = apt.professional_email === currentProfDetails.email;
          
          return matchById || matchByName || matchByEmail;
        }
      );
      
      console.log("Citas del profesional:", professionalAppointments);
      
      // Cargar todos los pacientes
      const allPatientsData = await apiService.getPatients();
      console.log("Pacientes cargados:", allPatientsData);
      
      // Crear lista de pacientes únicos que tienen citas con este profesional
      const uniquePatients = [];
      const seenPatientIdentifiers = new Set();

      professionalAppointments.forEach(apt => {
        let patientToAdd = null;
        
        // Buscar paciente por ID
        if (apt.patient_id) {
          patientToAdd = allPatientsData.find(p => p.id && p.id.toString() === apt.patient_id.toString());
        }
        
        // Si no se encuentra por ID, buscar por email
        if (!patientToAdd && apt.patient_email) {
          patientToAdd = allPatientsData.find(p => p.email === apt.patient_email);
        }
        
        // Si no se encuentra por email, buscar por nombre
        if (!patientToAdd && apt.patient_name) {
          patientToAdd = allPatientsData.find(p => p.name === apt.patient_name);
        }

        // Si aún no se encuentra, crear un paciente temporal
        if (!patientToAdd && apt.patient_name) {
          patientToAdd = {
            id: `temp-${apt.patient_name.replace(/\s+/g, '-')}`,
            name: apt.patient_name,
            email: apt.patient_email || 'No disponible',
            phone: apt.patient_phone || 'No disponible',
            isPlaceholder: true
          };
        }

        const patientIdentifier = patientToAdd?.id || patientToAdd?.name;
        if (patientToAdd && patientIdentifier && !seenPatientIdentifiers.has(patientIdentifier)) {
          uniquePatients.push(patientToAdd);
          seenPatientIdentifiers.add(patientIdentifier);
        }
      });
      
      console.log("Pacientes únicos:", uniquePatients);
      setPatients(uniquePatients);
      setFilteredPatients(uniquePatients);
      
    } catch (error) {
      console.error("Error cargando datos del portal profesional:", error);
      toast({
        title: "Error de carga",
        description: "No se pudieron cargar los datos. " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    const patientIdentifier = patient?.id || patient?.name;
    if (currentUser && currentUser.id && patientIdentifier) {
      const notes = localStorage.getItem(`clinical_notes_${currentUser.id}_${patientIdentifier}`);
      setClinicalNotes(notes || '');
    }
  };

  const handleSaveNotes = () => {
    if (!selectedPatient || !currentUser || !currentUser.id) return;
    const patientIdentifier = selectedPatient.id || selectedPatient.name;
    if (patientIdentifier) {
      localStorage.setItem(`clinical_notes_${currentUser.id}_${patientIdentifier}`, clinicalNotes);
      toast({ title: 'Notas Guardadas', description: 'Las notas clínicas se han guardado correctamente.' });
    }
  };

  const generatePrescriptionPDF = (patient, profDetails, presData, isExample = false) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPos = margin;

    if (clinicLogo) {
      try {
        doc.addImage(clinicLogo, 'PNG', margin, yPos, 30, 30); 
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
        doc.setFontSize(10);
        doc.text("LOGO", margin + 15, yPos + 15, {align: 'center'});
      }
    } else {
      doc.setFontSize(10);
      doc.text("LOGO AQUÍ", margin + 15, yPos + 15, {align: 'center'});
    }
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(clinicName, pageWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const clinicAddress = localStorage.getItem('clinic_address') || "Dirección de la clínica no configurada";
    const clinicPhone = localStorage.getItem('clinic_phone') || "Teléfono no configurado";
    doc.text(clinicAddress, pageWidth / 2, yPos + 18, { align: 'center' });
    doc.text(clinicPhone, pageWidth / 2, yPos + 24, { align: 'center' });
    yPos += 35;

    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('RECETA MÉDICA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Paciente:', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(patient.name || 'N/A', margin + 25, yPos);
    
    doc.setFont(undefined, 'bold');
    doc.text('Fecha:', pageWidth - margin - 40, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(new Date().toLocaleDateString('es-ES'), pageWidth - margin - 20, yPos);
    yPos += 7;

    doc.setFont(undefined, 'bold');
    doc.text('Edad:', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(patient.age ? `${patient.age} años` : 'N/A', margin + 25, yPos);
    yPos += 10;

    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Rp/', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    presData.medications.forEach((med, index) => {
      if (yPos > pageHeight - 40) { doc.addPage(); yPos = margin; }
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${med.name || 'Medicamento no especificado'}`, margin + 5, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');
      doc.text(`Dosis: ${med.dosage || 'No especificada'}`, margin + 10, yPos);
      yPos += 5;
      doc.text(`Indicaciones: ${med.instructions || 'No especificadas'}`, margin + 10, yPos);
      yPos += 8;
    });
    
    if (yPos > pageHeight - 60) { doc.addPage(); yPos = margin; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Observaciones Generales:', margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const observationsText = doc.splitTextToSize(presData.generalObservations || 'Ninguna.', pageWidth - margin * 2);
    doc.text(observationsText, margin, yPos);
    yPos += (observationsText.length * 5) + 10;

    if (yPos > pageHeight - 50) { doc.addPage(); yPos = margin; }
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
    
    doc.setFontSize(10);
    doc.text(`Dr(a). ${profDetails?.name || 'Nombre del Profesional'}`, margin, pageHeight - 25);
    const disciplineName = profDetails?.discipline_name || profDetails?.disciplineId || 'N/A';
    doc.text(`Especialidad: ${disciplineName}`, margin, pageHeight - 20);
    doc.text(`Licencia: ${profDetails?.license || 'N/A'}`, margin, pageHeight - 15);
    doc.text('Firma:', pageWidth - margin - 50, pageHeight - 25);
    doc.line(pageWidth - margin - 50, pageHeight - 28, pageWidth - margin - 15, pageHeight - 28);

    doc.save(`receta_${patient.name.replace(/\s/g, '_')}${isExample ? '_ejemplo' : ''}.pdf`);
    if (!isExample) {
      toast({ title: 'Receta Generada', description: 'La receta médica se ha descargado.' });
      setShowPrescriptionModal(false);
      setPrescriptionData({ medications: [{ name: '', dosage: '', instructions: '' }], generalObservations: '' });
    }
  };

  const handleGeneratePrescription = () => {
    if (!selectedPatient || !professionalDetails) {
      toast({ title: 'Error', description: 'Seleccione un paciente y asegúrese de que los detalles del profesional estén cargados.', variant: 'destructive' });
      return;
    }
    generatePrescriptionPDF(selectedPatient, professionalDetails, prescriptionData);
  };

  const handleShowExamplePrescription = (exampleNumber) => {
    const examplePatient = { name: "Juan Pérez Ejemplo", age: 30, email: "juan.ejemplo@example.com" };
    const exampleProfDetails = professionalDetails || { name: currentUser.name, discipline_name: "Medicina General Ejemplo", license: "12345 Ejemplo" };
    let examplePresData;

    if (exampleNumber === 1) {
      examplePresData = {
        medications: [
          { name: "Amoxicilina 500mg", dosage: "1 cápsula cada 8 horas por 7 días", instructions: "Tomar con alimentos." },
          { name: "Paracetamol 1g", dosage: "1 comprimido cada 6 horas si hay dolor o fiebre", instructions: "No exceder 4g al día." }
        ],
        generalObservations: "Reposo relativo por 48 horas. Beber abundantes líquidos. Volver a control en 7 días o antes si no hay mejoría."
      };
    } else {
      examplePresData = {
        medications: [
          { name: "Loratadina 10mg", dosage: "1 tableta al día por 10 días", instructions: "Preferiblemente por la mañana." }
        ],
        generalObservations: "Evitar exposición a alérgenos conocidos. Mantener ambiente limpio y ventilado."
      };
    }
    generatePrescriptionPDF(examplePatient, exampleProfDetails, examplePresData, true);
    toast({ title: `Ejemplo ${exampleNumber} Generado`, description: `Se ha descargado un PDF de ejemplo para la receta ${exampleNumber}.` });
  };
  
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescriptionData.medications];
    updatedMedications[index][field] = value;
    setPrescriptionData({ ...prescriptionData, medications: updatedMedications });
  };

  const addMedicationField = () => {
    setPrescriptionData({
      ...prescriptionData,
      medications: [...prescriptionData.medications, { name: '', dosage: '', instructions: '' }]
    });
  };

  const removeMedicationField = (index) => {
    const updatedMedications = prescriptionData.medications.filter((_, i) => i !== index);
    setPrescriptionData({ ...prescriptionData, medications: updatedMedications });
  };

  const getPatientAppointments = () => {
    if (!selectedPatient || !professionalDetails) return [];
    
    return allAppointments.filter(apt => {
      const matchPatient = (apt.patient_id && selectedPatient.id && apt.patient_id.toString() === selectedPatient.id.toString()) || 
                           apt.patient_name === selectedPatient.name ||
                           apt.patient_email === selectedPatient.email;
      const matchProfessional = (apt.professional_id && apt.professional_id.toString() === professionalDetails.id.toString()) || 
                               apt.professional_name === professionalDetails.name ||
                               (apt.professional_name && professionalDetails.name && 
                                apt.professional_name.includes(professionalDetails.name.split(' ')[0]));
      return matchPatient && matchProfessional;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Portal del Profesional</h1>
          <p className="text-muted-foreground mt-1">Cargando datos...</p>
        </div>
        <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 mx-auto w-1/3"></div>
            <div className="h-4 bg-muted rounded mb-2 mx-auto w-1/2"></div>
            <div className="h-4 bg-muted rounded mx-auto w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Portal del Profesional</h1>
          <p className="text-muted-foreground mt-1">Bienvenido, {currentUser?.name || 'Profesional'}. Selecciona un paciente para ver sus detalles.</p>
          {currentUser?.type === 'professional' && (
            <p className="text-sm text-primary mt-1">Sesión iniciada como profesional</p>
          )}
          {professionalDetails && (
            <p className="text-sm text-muted-foreground mt-1">
              {professionalDetails.name} - {professionalDetails.discipline_name || 'Especialidad no definida'}
            </p>
          )}
        </div>
        <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar paciente por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
        </div>
        {filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map(patient => (
              <motion.div
                key={patient.id || patient.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleSelectPatient(patient)}
                className="bg-card rounded-xl shadow-lg p-6 card-hover cursor-pointer border border-border/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent-alt rounded-full flex items-center justify-center text-white">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">{patient.email || 'Email no disponible'}</p>
                    {patient.isPlaceholder && (
                      <p className="text-xs text-amber-600 mt-1">Perfil temporal</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
            <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No hay pacientes</h3>
            <p className="text-muted-foreground text-sm">No se encontraron pacientes asignados a este profesional.</p>
            {professionalDetails && (
              <p className="text-xs text-muted-foreground mt-2">
                Buscando citas para: {professionalDetails.name}
              </p>
            )}
          </div>
        )}
         <div className="mt-8 bg-card rounded-xl shadow-lg p-6 border border-border/50">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Ejemplos de Recetas PDF</h2>
            <p className="text-muted-foreground mb-4">Haz clic para descargar ejemplos de cómo se verían las recetas generadas.</p>
            <div className="flex space-x-4">
                <Button onClick={() => handleShowExamplePrescription(1)} variant="outline">
                    <Eye className="w-4 h-4 mr-2" /> Ver Ejemplo 1
                </Button>
                <Button onClick={() => handleShowExamplePrescription(2)} variant="outline">
                    <Eye className="w-4 h-4 mr-2" /> Ver Ejemplo 2
                </Button>
            </div>
        </div>
      </div>
    );
  }

  const patientAppointments = getPatientAppointments();

  return (
    <div className="space-y-6">
      <Button onClick={() => setSelectedPatient(null)} variant="outline" className="mb-4">
        <ChevronLeft className="w-4 h-4 mr-2" /> Volver a la lista de pacientes
      </Button>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Detalles de {selectedPatient.name}</h1>
        <p className="text-muted-foreground mt-1">Gestiona la información clínica del paciente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Edit2 className="w-5 h-5 mr-2 text-primary" /> Notas Clínicas
            </h2>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={8}
              className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              placeholder="Escribe aquí tus notas sobre el paciente..."
            />
            <Button onClick={handleSaveNotes} className="mt-4 button-primary-gradient">Guardar Notas</Button>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" /> Generar Receta Médica
            </h2>
            <Button onClick={() => setShowPrescriptionModal(true)} className="button-primary-gradient">
              <PlusCircle className="w-4 h-4 mr-2" /> Crear Nueva Receta
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" /> Información del Paciente
            </h2>
            <p><strong>Nombre:</strong> {selectedPatient.name}</p>
            <p><strong>Email:</strong> {selectedPatient.email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {selectedPatient.phone || 'N/A'}</p>
            {selectedPatient.age && <p><strong>Edad:</strong> {selectedPatient.age} años</p>}
            {selectedPatient.isPlaceholder && <p className="text-xs text-amber-600 mt-2">Este es un perfil de paciente temporal. Completa su registro en 'Pacientes'.</p>}
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" /> Historial de Citas
            </h2>
            {patientAppointments.length > 0 ? (
              <ul className="space-y-3">
                {patientAppointments.map(apt => (
                  <li key={apt.id} className="text-sm p-3 bg-muted/50 rounded-md">
                    <p><strong>Fecha:</strong> {new Date(apt.date).toLocaleDateString('es-ES')} - {apt.time}</p>
                    <p><strong>Tipo:</strong> {apt.type}</p>
                    <p><strong>Folio:</strong> {apt.folio}</p>
                    <p><strong>Estado:</strong> {apt.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No hay citas registradas para este paciente contigo.</p>
            )}
          </div>
        </motion.div>
      </div>

      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-border my-8"
          >
            <h2 className="text-xl font-bold text-card-foreground mb-6">Nueva Receta Médica</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {prescriptionData.medications.map((med, index) => (
                <div key={index} className="p-4 border border-border/70 rounded-lg space-y-3 bg-background/50">
                  <h3 className="font-semibold text-md text-foreground">Medicamento {index + 1}</h3>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre del Medicamento</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Dosis</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Instrucciones</label>
                    <textarea
                      value={med.instructions}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    />
                  </div>
                  {prescriptionData.medications.length > 1 && (
                    <Button variant="destructive" size="sm" onClick={() => removeMedicationField(index)}>
                      Eliminar Medicamento
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMedicationField} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" /> Añadir Otro Medicamento
              </Button>
              <div className="pt-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Observaciones Generales</label>
                <textarea
                  value={prescriptionData.generalObservations}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, generalObservations: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Indicaciones adicionales, próxima cita, etc."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowPrescriptionModal(false)}>Cancelar</Button>
              <Button onClick={handleGeneratePrescription} className="button-primary-gradient">
                <Download className="w-4 h-4 mr-2" /> Generar y Descargar PDF
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalPortal;