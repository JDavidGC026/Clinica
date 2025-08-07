import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
// Logo se carga dinámicamente desde /logo.jpeg

const ReportManager = () => {
  const [reportType, setReportType] = useState('appointments');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const generateAppointmentsReport = () => {
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const clinicName = localStorage.getItem('clinic_name') || 'MultiClinic';

    const doc = new jsPDF();
    const margin = 14;
    let yPos = 10;

    // Agregar el logo
    const logoImg = new Image();
    logoImg.onload = function() {
      doc.addImage(logoImg, 'JPEG', margin, yPos, 42, 24);
      generateReportContent();
    };
    
    logoImg.onerror = function() {
      // Si no se puede cargar el logo, continuar sin él
      generateReportContent();
    };
    
    logoImg.src = '/logo.jpeg';
    
    function generateReportContent() {
      // Continuar con el resto del PDF
      doc.setFontSize(18);
      doc.text(`${clinicName} - Reporte de Citas`, 40, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 40, 30);
      
      let yPos = 50;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Paciente", 14, yPos);
      doc.text("Profesional", 60, yPos);
      doc.text("Fecha", 110, yPos);
      doc.text("Hora", 140, yPos);
      doc.text("Estado", 170, yPos);
      yPos += 7;
      doc.setLineWidth(0.5);
      doc.line(14, yPos-2, 196, yPos-2);
      doc.setFont(undefined, 'normal');

      appointments.forEach(apt => {
        if (yPos > 270) { // Page break
          doc.addPage();
          yPos = 20;
        }
        const professional = professionals.find(p => p.id.toString() === apt.professionalId) || { name: 'N/A' };
        doc.text(apt.patientName.substring(0,25), 14, yPos);
        doc.text(professional.name.substring(0,20), 60, yPos);
        doc.text(new Date(apt.date).toLocaleDateString('es-ES'), 110, yPos);
        doc.text(apt.time, 140, yPos);
        doc.text(apt.status, 170, yPos);
        yPos += 7;
      });

      doc.save('reporte_citas.pdf');
      toast({ title: "Reporte Generado", description: "El reporte de citas se ha descargado." });
    }
  };
  
  const handleGenerateReport = () => {
    switch (reportType) {
      case 'appointments':
        generateAppointmentsReport();
        break;
      case 'patients':
      case 'professionals':
        toast({
          title: "🚧 Funcionalidad en desarrollo",
          description: `La generación de reportes para ${reportType} aún no está implementada.`,
          variant: "default"
        });
        break;
      default:
        toast({ title: "Error", description: "Tipo de reporte no válido.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Generación de Reportes</h1>
          <p className="text-gray-600 mt-1">Crea y descarga reportes en formato PDF</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="space-y-6">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Reporte
            </label>
            <select
              id="reportType"
              name="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="appointments">Reporte de Citas</option>
              <option value="patients">Reporte de Pacientes</option>
              <option value="professionals">Reporte de Profesionales</option>
            </select>
          </div>

          {/* Filtros de Fecha (opcional, para futuras mejoras) */}
          {/* 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          */}

          <div className="flex justify-end">
            <Button
              onClick={handleGenerateReport}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Generar Reporte
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Tipos de Reportes Disponibles
        </h2>
        <ul className="space-y-3">
          <li className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 mr-3 text-blue-500" />
            <div>
              <p className="font-medium text-gray-800">Reporte de Citas</p>
              <p className="text-sm text-gray-600">Lista detallada de todas las citas programadas, completadas, etc.</p>
            </div>
          </li>
          <li className="flex items-center p-3 bg-gray-50 rounded-lg opacity-60">
            <Users className="w-5 h-5 mr-3 text-green-500" />
            <div>
              <p className="font-medium text-gray-800">Reporte de Pacientes (Próximamente)</p>
              <p className="text-sm text-gray-600">Información demográfica y de contacto de los pacientes.</p>
            </div>
          </li>
          <li className="flex items-center p-3 bg-gray-50 rounded-lg opacity-60">
            <Briefcase className="w-5 h-5 mr-3 text-indigo-500" />
            <div>
              <p className="font-medium text-gray-800">Reporte de Profesionales (Próximamente)</p>
              <p className="text-sm text-gray-600">Detalles de los profesionales, especialidades y horarios.</p>
            </div>
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default ReportManager;