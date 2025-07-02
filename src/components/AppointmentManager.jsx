import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Calendar, Clock, User, Edit, Trash2, DollarSign, FileText, Send, Mail, Phone, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AppointmentForm from '@/components/AppointmentForm';
import apiService from '@/services/ApiService';
import EmailService from '@/services/EmailService';
import jsPDF from 'jspdf';

const AppointmentManager = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [clinicName, setClinicName] = useState("Grupo Médico Delux");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
    const storedClinicName = localStorage.getItem('clinic_name');
    if (storedClinicName) {
        setClinicName(storedClinicName);
    }
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, paymentStatusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await apiService.getAppointments();
      setAppointments(appointmentsData.sort((a,b) => new Date(b.date) - new Date(a.date) || a.time.localeCompare(b.time)));
    } catch (error) {
      console.error('Error cargando citas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas.",
        variant: "destructive"
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.professional_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.payment_status === paymentStatusFilter);
    }

    setFilteredAppointments(filtered);
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      const newAppointment = await apiService.createAppointment(appointmentData);
      setAppointments(prev => [newAppointment, ...prev]);
      setShowForm(false);
      
      toast({
        title: "Cita creada",
        description: `La cita con folio ${newAppointment.folio} ha sido programada.`,
      });

      // Enviar email de confirmación automáticamente
      if (newAppointment.patient_email && EmailService.isConfigured()) {
        try {
          const emailData = {
            patient_name: newAppointment.patient_name,
            professional_name: newAppointment.professional_name,
            appointment_date: `${newAppointment.date} a las ${newAppointment.time}`,
            appointment_type: newAppointment.type,
            folio: newAppointment.folio
          };

          await EmailService.sendEmail('appointment-confirmation', newAppointment.patient_email, emailData);
          
          toast({
            title: "Email enviado",
            description: `Confirmación enviada a ${newAppointment.patient_email}`,
          });
        } catch (emailError) {
          console.error('Error enviando email:', emailError);
          toast({
            title: "Cita creada, email no enviado",
            description: "La cita se creó pero no se pudo enviar el email de confirmación.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error creando cita:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la cita: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditAppointment = async (appointmentData) => {
    try {
      const updatedAppointment = await apiService.updateAppointment(editingAppointment.id, appointmentData);
      setAppointments(prev => prev.map(apt =>
        apt.id === editingAppointment.id ? updatedAppointment : apt
      ));
      setEditingAppointment(null);
      setShowForm(false);
      
      toast({
        title: "Cita actualizada",
        description: `La cita con folio ${appointmentData.folio} ha sido actualizada.`,
      });
    } catch (error) {
      console.error('Error actualizando cita:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await apiService.deleteAppointment(id);
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      
      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada del sistema.",
      });
    } catch (error) {
      console.error('Error eliminando cita:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = async (appointment, type = 'appointment-reminder') => {
    if (!appointment.patient_email) {
      toast({
        title: "Error",
        description: "No hay email registrado para este paciente.",
        variant: "destructive"
      });
      return;
    }

    if (!EmailService.isConfigured()) {
      toast({
        title: "Configuración requerida",
        description: "Configure las credenciales SMTP en Configuración primero.",
        variant: "destructive"
      });
      return;
    }

    try {
      const emailData = {
        patient_name: appointment.patient_name,
        professional_name: appointment.professional_name,
        appointment_date: `${appointment.date} a las ${appointment.time}`,
        appointment_type: appointment.type,
        folio: appointment.folio
      };

      await EmailService.sendEmail(type, appointment.patient_email, emailData);
      
      toast({
        title: "Email enviado",
        description: `${type === 'appointment-reminder' ? 'Recordatorio' : 'Confirmación'} enviado a ${appointment.patient_email}`,
      });
    } catch (error) {
      console.error('Error enviando email:', error);
      toast({
        title: "Error al enviar email",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'en-progreso': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-amber-100 text-amber-800';
      case 'cancelado_sin_costo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status, type = 'general') => {
    const generalLabels = {
      programada: 'Programada', completada: 'Completada', cancelada: 'Cancelada', 'en-progreso': 'En Progreso'
    };
    const paymentLabels = {
      pagado: 'Pagado', pendiente: 'Pendiente', cancelado_sin_costo: 'Cancelado (S/C)'
    };
    return type === 'payment' ? (paymentLabels[status] || status) : (generalLabels[status] || status);
  };

  const generatePatientReportPDF = async (appointment) => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.setTextColor(40, 58, 90);
      doc.text(clinicName, 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Folio de Cita: ${appointment.folio}`, 14, 40);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 14, 48);

      doc.setLineWidth(0.5);
      doc.line(14, 55, 196, 55);

      doc.setFontSize(16);
      doc.setTextColor(40, 58, 90);
      doc.text("Detalles de la Cita", 14, 65);

      doc.setFontSize(11);
      doc.setTextColor(50);
      let yPos = 75;
      const addDetail = (label, value) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 14, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, 60, yPos);
        yPos += 8;
      };

      addDetail("Paciente:", appointment.patient_name);
      addDetail("Email:", appointment.patient_email || 'No disponible');
      addDetail("Teléfono:", appointment.patient_phone || 'No disponible');
      addDetail("Profesional:", appointment.professional_name);
      addDetail("Disciplina:", appointment.professional_info?.discipline || 'No disponible');
      addDetail("Fecha:", new Date(appointment.date).toLocaleDateString('es-ES'));
      addDetail("Hora:", appointment.time);
      addDetail("Tipo:", appointment.type);
      addDetail("Costo:", `$${parseFloat(appointment.cost || 0).toFixed(2)} MXN`);
      addDetail("Estado Pago:", getStatusLabel(appointment.payment_status, 'payment'));
      addDetail("Estado General:", getStatusLabel(appointment.status));
      
      if(appointment.notes) {
          yPos += 4;
          doc.setFont(undefined, 'bold');
          doc.text("Notas:", 14, yPos);
          yPos += 8;
          doc.setFont(undefined, 'normal');
          const notesLines = doc.splitTextToSize(appointment.notes, 180);
          doc.text(notesLines, 14, yPos);
          yPos += (notesLines.length * 6);
      }

      doc.line(14, yPos + 5, 196, yPos + 5);
      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Gracias por su preferencia.", 105, yPos, { align: 'center' });
      doc.text(`Contacto: ${localStorage.getItem('clinic_phone') || '(123) 456-7890'}`, 105, yPos + 5, { align: 'center' });

      doc.save(`cita_${appointment.folio}_${appointment.patient_name.replace(/\s/g, '_')}.pdf`);
      toast({ title: "Reporte PDF Generado", description: "El reporte de la cita se ha descargado." });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF: " + error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Citas</h1>
            <p className="text-muted-foreground mt-1">Cargando citas...</p>
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-lg p-12 text-center border border-border/50">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Citas</h1>
          <p className="text-muted-foreground mt-1">Administra las citas de {clinicName}</p>
        </div>
        <Button
          onClick={() => {
            setEditingAppointment(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto button-primary-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por paciente, profesional o folio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            >
              <option value="all">Estado General (Todos)</option>
              <option value="programada">Programadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="en-progreso">En Progreso</option>
            </select>
          </div>
           <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            >
              <option value="all">Estado Pago (Todos)</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado_sin_costo">Cancelado (S/C)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border/50">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No hay citas</h3>
            <p className="text-muted-foreground text-sm">
              {appointments.length === 0 
                ? 'Comienza creando tu primera cita' 
                : 'No se encontraron citas con los filtros aplicados'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 hidden md:table-header-group">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Profesional</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Costo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado General</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredAppointments.map((appointment) => (
                  <motion.tr key={appointment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-muted/30 flex flex-col md:table-row py-4 px-4 md:p-0">
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-primary">{appointment.folio}</div>
                    </td>
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-accent-alt flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-card-foreground">{appointment.patient_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {appointment.patient_email && (
                              <span className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {appointment.patient_email}
                              </span>
                            )}
                            {appointment.patient_phone && (
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {appointment.patient_phone}
                              </span>
                            )}
                          </div>
                          {appointment.patient_info?.age && (
                            <div className="text-xs text-muted-foreground">
                              {appointment.patient_info.age} años - {appointment.patient_info.gender}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span className="font-bold md:hidden">Profesional: </span>
                      <div className="text-sm font-medium text-card-foreground inline md:block">{appointment.professional_name}</div>
                      {appointment.professional_info?.discipline && (
                        <div className="text-xs text-muted-foreground">{appointment.professional_info.discipline}</div>
                      )}
                    </td>
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-card-foreground">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {new Date(appointment.date).toLocaleDateString('es-ES')}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-2 text-muted-foreground" />
                        {appointment.time}
                      </div>
                    </td>
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span className="font-bold md:hidden">Costo: </span>
                      <span className="text-sm text-card-foreground">${parseFloat(appointment.cost || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap">
                       <span className="font-bold md:hidden">Estado Pago: </span>
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(appointment.payment_status)}`}>
                        {getStatusLabel(appointment.payment_status, 'payment')}
                      </span>
                    </td>
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap">
                       <span className="font-bold md:hidden">Estado General: </span>
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </td>
                    <td className="px-0 md:px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1 mt-2 md:mt-0">
                        <Button size="sm" variant="outline" onClick={() => { setEditingAppointment(appointment); setShowForm(true); }} title="Editar Cita">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => generatePatientReportPDF(appointment)} title="Descargar PDF">
                          <FileText className="w-4 h-4" />
                        </Button>
                        {appointment.patient_email && (
                          <Button size="sm" variant="outline" onClick={() => handleSendEmail(appointment, 'appointment-reminder')} title="Enviar Recordatorio">
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDeleteAppointment(appointment.id)} title="Eliminar Cita" className="text-destructive hover:text-destructive/90">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <AppointmentForm
          appointment={editingAppointment}
          onSubmit={editingAppointment ? handleEditAppointment : handleAddAppointment}
          onCancel={() => { setShowForm(false); setEditingAppointment(null); }}
        />
      )}
    </div>
  );
};

export default AppointmentManager;