import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, Download, Filter, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import apiService from '@/services/ApiService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FinanceManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [timePeriod, setTimePeriod] = useState('month'); // 'week', 'month', 'year'
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [currentExpense, setCurrentExpense] = useState({ 
    description: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    type: 'egreso',
    category: ''
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [clinicName, setClinicName] = useState("Grupo Médico Delux");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const storedClinicName = localStorage.getItem('clinic_name');
    if (storedClinicName) {
        setClinicName(storedClinicName);
    }
    loadTransactions();
  }, []);

  useEffect(() => {
    filterAndProcessTransactions();
  }, [transactions, timePeriod]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Cargar citas desde la API
      const appointments = await apiService.getAppointments();
      
      // Cargar egresos manuales desde localStorage
      const manualExpenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');

      // Procesar ingresos desde citas pagadas
      const incomeFromAppointments = appointments
        .filter(apt => apt.payment_status === 'pagado' && apt.cost && parseFloat(apt.cost) > 0)
        .map(apt => ({
          id: `apt-${apt.id}`,
          description: `Cita: ${apt.patient_name} (Folio: ${apt.folio})`,
          amount: parseFloat(apt.cost),
          date: apt.date,
          type: 'ingreso',
          category: 'Consultas Médicas',
          source: 'appointment',
          appointmentId: apt.id,
          professionalName: apt.professional_name,
          patientName: apt.patient_name,
          appointmentType: apt.type
        }));
      
      // Procesar egresos manuales
      const processedExpenses = manualExpenses.map(exp => ({
        ...exp, 
        amount: parseFloat(exp.amount),
        source: 'manual'
      }));

      // Combinar todas las transacciones
      const allTransactions = [...incomeFromAppointments, ...processedExpenses];
      
      // Ordenar por fecha (más recientes primero)
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setTransactions(allTransactions);
      setLastUpdate(new Date());
      
      toast({
        title: "Datos actualizados",
        description: `Se cargaron ${incomeFromAppointments.length} ingresos de citas y ${processedExpenses.length} egresos manuales.`,
      });
      
    } catch (error) {
      console.error('Error cargando transacciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos financieros: " + error.message,
        variant: "destructive"
      });
      
      // Fallback a datos locales en caso de error
      const manualExpenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
      setTransactions(manualExpenses.map(exp => ({...exp, amount: parseFloat(exp.amount), source: 'manual'})));
    } finally {
      setLoading(false);
    }
  };

  const saveManualExpenses = (expenses) => {
    localStorage.setItem('clinic_expenses', JSON.stringify(expenses));
    loadTransactions(); // Recargar todas las transacciones
  };

  const handleAddOrEditExpense = (e) => {
    e.preventDefault();
    const manualExpenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    
    if (editingExpenseId) {
      const updatedExpenses = manualExpenses.map(exp => 
        exp.id === editingExpenseId ? {...currentExpense, id: editingExpenseId} : exp
      );
      saveManualExpenses(updatedExpenses);
      toast({
        title: "Egreso Actualizado", 
        description: "El egreso ha sido modificado."
      });
    } else {
      const newExpense = {
        ...currentExpense, 
        id: `exp-${Date.now()}`,
        type: 'egreso' // Asegurar que siempre sea egreso
      };
      saveManualExpenses([...manualExpenses, newExpense]);
      toast({
        title: "Egreso Agregado", 
        description: "El nuevo egreso ha sido registrado."
      });
    }
    
    setShowExpenseForm(false);
    setCurrentExpense({ 
      description: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      type: 'egreso',
      category: ''
    });
    setEditingExpenseId(null);
  };

  const handleDeleteExpense = (id) => {
    const manualExpenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    saveManualExpenses(manualExpenses.filter(exp => exp.id !== id));
    toast({
      title: "Egreso Eliminado", 
      description: "El egreso ha sido eliminado."
    });
  };

  const filterAndProcessTransactions = () => {
    const now = new Date();
    let startDate, endDate;

    if (timePeriod === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) + 6);
    } else if (timePeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else { // year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
    
    setFilteredTransactions(filtered);
  };

  const getChartData = () => {
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    const dataMap = new Map();

    filteredTransactions.forEach(t => {
      let key;
      const tDate = new Date(t.date);
      
      if (timePeriod === 'week') {
        key = `${tDate.getFullYear()}-W${getWeekNumber(tDate)}`;
      } else if (timePeriod === 'month') {
        key = tDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      } else { // year
        key = tDate.toLocaleDateString('es-ES', { month: 'short' });
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { income: 0, expense: 0, date: tDate });
      }
      
      if (t.type === 'ingreso') {
        dataMap.get(key).income += t.amount;
      } else {
        dataMap.get(key).expense += t.amount;
      }
    });
    
    const sortedData = Array.from(dataMap.entries()).sort((a, b) => a[1].date - b[1].date);

    sortedData.forEach(([key, value]) => {
      labels.push(key);
      incomeData.push(value.income);
      expenseData.push(value.expense);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Egresos',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: `Resumen Financiero (${timePeriod === 'week' ? 'Semanal' : timePeriod === 'month' ? 'Mensual' : 'Anual'})` 
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString('es-MX');
          }
        }
      }
    }
  };

  const generateFinanceReportPDF = () => {
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(18);
    doc.text(`${clinicName} - Reporte Financiero`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periodo: ${timePeriod === 'week' ? 'Semanal' : timePeriod === 'month' ? 'Mensual' : 'Anual'}`, 14, 30);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 38);
    if (lastUpdate) {
      doc.text(`Última actualización: ${lastUpdate.toLocaleDateString('es-ES')} ${lastUpdate.toLocaleTimeString('es-ES')}`, 14, 46);
    }

    // Tabla de transacciones
    const tableColumn = ["Fecha", "Descripción", "Categoría", "Tipo", "Monto (MXN)"];
    const tableRows = [];

    filteredTransactions.forEach(t => {
      const transactionData = [
        new Date(t.date).toLocaleDateString('es-ES'),
        t.description,
        t.category || 'N/A',
        t.type === 'ingreso' ? 'Ingreso' : 'Egreso',
        (t.type === 'ingreso' ? '+' : '-') + '$' + t.amount.toFixed(2)
      ];
      tableRows.push(transactionData);
    });

    doc.autoTable({
      startY: 54,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 73] },
      styles: { fontSize: 8 }
    });
    
    let finalY = doc.lastAutoTable.finalY || 54;
    finalY += 10;

    // Resumen financiero
    const totalIncome = filteredTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;
    
    // Desglose por fuente
    const incomeFromAppointments = filteredTransactions.filter(t => t.source === 'appointment').reduce((sum, t) => sum + t.amount, 0);
    const manualExpenses = filteredTransactions.filter(t => t.source === 'manual' && t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('RESUMEN FINANCIERO', 14, finalY);
    finalY += 8;
    
    doc.setFontSize(10);
    doc.text(`Total Ingresos: $${totalIncome.toFixed(2)} MXN`, 14, finalY);
    doc.text(`  - De citas pagadas: $${incomeFromAppointments.toFixed(2)} MXN`, 20, finalY + 6);
    finalY += 14;
    
    doc.text(`Total Egresos: $${totalExpense.toFixed(2)} MXN`, 14, finalY);
    doc.text(`  - Egresos manuales: $${manualExpenses.toFixed(2)} MXN`, 20, finalY + 6);
    finalY += 14;
    
    doc.setFont(undefined, 'bold');
    doc.text(`Balance Neto: $${netBalance.toFixed(2)} MXN`, 14, finalY);

    doc.save(`reporte_financiero_${timePeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ 
      title: "Reporte PDF Generado", 
      description: "El reporte financiero se ha descargado." 
    });
  };

  const getFinancialSummary = () => {
    const totalIncome = filteredTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);
    const incomeFromAppointments = filteredTransactions.filter(t => t.source === 'appointment').reduce((sum, t) => sum + t.amount, 0);
    const appointmentCount = filteredTransactions.filter(t => t.source === 'appointment').length;
    
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      incomeFromAppointments,
      appointmentCount
    };
  };

  const summary = getFinancialSummary();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ingresos y Egresos</h1>
            <p className="text-muted-foreground mt-1">Cargando datos financieros...</p>
          </div>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ingresos y Egresos</h1>
          <p className="text-muted-foreground mt-1">Análisis financiero de {clinicName}</p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-1">
              Última actualización: {lastUpdate.toLocaleString('es-ES')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTransactions} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => { 
            setCurrentExpense({ 
              description: '', 
              amount: '', 
              date: new Date().toISOString().split('T')[0], 
              type: 'egreso',
              category: ''
            }); 
            setEditingExpenseId(null); 
            setShowExpenseForm(true);
          }} className="button-primary-gradient">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Egreso
          </Button>
          <Button onClick={generateFinanceReportPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Reporte PDF
          </Button>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">${summary.totalIncome.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{summary.appointmentCount} citas pagadas</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Egresos Totales</p>
              <p className="text-2xl font-bold text-red-600">${summary.totalExpense.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance Neto</p>
              <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.netBalance.toFixed(2)}
              </p>
            </div>
            <BarChart3 className={`w-8 h-8 ${summary.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">De Consultas</p>
              <p className="text-2xl font-bold text-blue-600">${summary.incomeFromAppointments.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {((summary.incomeFromAppointments / summary.totalIncome) * 100 || 0).toFixed(1)}% del total
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filtros y Gráfico */}
      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          >
            <option value="week">Semanal</option>
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
          </select>
        </div>
        <div className="h-[400px]">
          {filteredTransactions.length > 0 ? (
            <Bar data={getChartData()} options={chartOptions} />
          ) : (
            <p className="text-center text-muted-foreground py-10">
              No hay datos para el periodo seleccionado.
            </p>
          )}
        </div>
      </div>
      
      {/* Modal de Egreso */}
      {showExpenseForm && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md border border-border">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground">
              {editingExpenseId ? 'Editar Egreso' : 'Nuevo Egreso'}
            </h3>
            <form onSubmit={handleAddOrEditExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Descripción</label>
                <input 
                  type="text" 
                  value={currentExpense.description} 
                  onChange={e => setCurrentExpense({...currentExpense, description: e.target.value})} 
                  className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Monto (MXN)</label>
                <input 
                  type="number" 
                  value={currentExpense.amount} 
                  onChange={e => setCurrentExpense({...currentExpense, amount: e.target.value})} 
                  className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" 
                  required 
                  min="0.01" 
                  step="0.01" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Fecha</label>
                <input 
                  type="date" 
                  value={currentExpense.date} 
                  onChange={e => setCurrentExpense({...currentExpense, date: e.target.value})} 
                  className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Categoría</label>
                <input 
                  type="text" 
                  value={currentExpense.category || ''} 
                  onChange={e => setCurrentExpense({...currentExpense, category: e.target.value})} 
                  placeholder="Ej: Renta, Suministros, Equipamiento" 
                  className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowExpenseForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="button-primary-gradient">
                  {editingExpenseId ? 'Guardar Cambios' : 'Agregar Egreso'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Tabla de Transacciones Recientes */}
      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">
          Transacciones Recientes ({filteredTransactions.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Descripción</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Categoría</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Monto</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.slice(0, 10).map(transaction => (
                <tr key={transaction.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-2 text-card-foreground">
                    <div className="max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                    {transaction.source === 'appointment' && (
                      <div className="text-xs text-muted-foreground">
                        {transaction.professionalName} • {transaction.appointmentType}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      transaction.source === 'appointment' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'ingreso' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold ${
                    transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'ingreso' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {transaction.source === 'manual' && transaction.type === 'egreso' && (
                      <div className="flex justify-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setCurrentExpense(transaction); 
                            setEditingExpenseId(transaction.id); 
                            setShowExpenseForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4"/>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteExpense(transaction.id)} 
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </div>
                    )}
                    {transaction.source === 'appointment' && (
                      <span className="text-xs text-muted-foreground">Automático</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No hay transacciones para el periodo seleccionado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceManager;