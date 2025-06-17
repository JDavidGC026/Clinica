import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, Download, Filter, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FinanceManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [timePeriod, setTimePeriod] = useState('month'); // 'week', 'month', 'year'
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [currentExpense, setCurrentExpense] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'egreso' });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [clinicName, setClinicName] = useState("Grupo Médico Delux");

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

  const loadTransactions = () => {
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const manualExpenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');

    const incomeFromAppointments = appointments
      .filter(apt => apt.paymentStatus === 'pagado' && apt.cost)
      .map(apt => ({
        id: `apt-${apt.id}`,
        description: `Cita: ${apt.patientName} (Folio: ${apt.folio})`,
        amount: parseFloat(apt.cost),
        date: apt.date,
        type: 'ingreso',
        category: 'Consultas'
      }));
    
    const allTransactions = [...incomeFromAppointments, ...manualExpenses.map(exp => ({...exp, amount: parseFloat(exp.amount)}))];
    setTransactions(allTransactions.sort((a,b) => new Date(b.date) - new Date(a.date)));
  };

  const saveManualExpenses = (expenses) => {
    localStorage.setItem('clinic_expenses', JSON.stringify(expenses));
    loadTransactions(); // Recalculate all transactions
  };

  const handleAddOrEditExpense = (e) => {
    e.preventDefault();
    const manualExpenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    if (editingExpenseId) {
      const updatedExpenses = manualExpenses.map(exp => exp.id === editingExpenseId ? {...currentExpense, id: editingExpenseId} : exp);
      saveManualExpenses(updatedExpenses);
      toast({title: "Egreso Actualizado", description: "El egreso ha sido modificado."});
    } else {
      const newExpense = {...currentExpense, id: `exp-${Date.now()}`};
      saveManualExpenses([...manualExpenses, newExpense]);
      toast({title: "Egreso Agregado", description: "El nuevo egreso ha sido registrado."});
    }
    setShowExpenseForm(false);
    setCurrentExpense({ description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'egreso' });
    setEditingExpenseId(null);
  };

  const handleDeleteExpense = (id) => {
    const manualExpenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    saveManualExpenses(manualExpenses.filter(exp => exp.id !== id));
    toast({title: "Egreso Eliminado", description: "El egreso ha sido eliminado."});
  };


  const filterAndProcessTransactions = () => {
    const now = new Date();
    let startDate, endDate = new Date(now); // endDate is today or end of current period

    if (timePeriod === 'week') {
      startDate = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - 7 )); // Start of last week (Monday)
      endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 6)); // End of last week (Sunday)
    } else if (timePeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() -1, 1); // Start of last month
      endDate = new Date(now.getFullYear(), now.getMonth(), 0); // End of last month
    } else { // year
      startDate = new Date(now.getFullYear() -1, 0, 1); // Start of last year
      endDate = new Date(now.getFullYear() -1, 11, 31); // End of last year
    }
    
    // For current period view:
    if (timePeriod === 'week') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) );
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) + 6);
    } else if (timePeriod === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else { // year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
    }


    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

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
    
    const sortedData = Array.from(dataMap.entries()).sort((a,b) => a[1].date - b[1].date);

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
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Egresos',
          data: expenseData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Resumen Financiero (${timePeriod})` },
    },
    scales: {
        y: { beginAtZero: true }
    }
  };

  const generateFinanceReportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${clinicName} - Reporte Financiero`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periodo: ${timePeriod === 'week' ? 'Semanal' : timePeriod === 'month' ? 'Mensual' : 'Anual'}`, 14, 30);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 38);

    const tableColumn = ["Fecha", "Descripción", "Categoría", "Tipo", "Monto (MXN)"];
    const tableRows = [];

    filteredTransactions.forEach(t => {
      const transactionData = [
        new Date(t.date).toLocaleDateString('es-ES'),
        t.description,
        t.category || 'N/A',
        t.type === 'ingreso' ? 'Ingreso' : 'Egreso',
        t.amount.toFixed(2)
      ];
      tableRows.push(transactionData);
    });

    doc.autoTable({
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 73] }, // Dark blue from palette
    });
    
    let finalY = doc.lastAutoTable.finalY || 50;
    finalY += 10;

    const totalIncome = filteredTransactions.filter(t=>t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t=>t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    doc.setFontSize(12);
    doc.text(`Total Ingresos: $${totalIncome.toFixed(2)} MXN`, 14, finalY);
    doc.text(`Total Egresos: $${totalExpense.toFixed(2)} MXN`, 14, finalY + 8);
    doc.setFont(undefined, 'bold');
    doc.text(`Balance Neto: $${netBalance.toFixed(2)} MXN`, 14, finalY + 16);

    doc.save(`reporte_financiero_${timePeriod}.pdf`);
    toast({ title: "Reporte PDF Generado", description: "El reporte financiero se ha descargado." });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ingresos y Egresos</h1>
          <p className="text-muted-foreground mt-1">Análisis financiero de {clinicName}</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => { setCurrentExpense({ description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'egreso' }); setEditingExpenseId(null); setShowExpenseForm(true);}} className="button-primary-gradient">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Egreso
            </Button>
            <Button onClick={generateFinanceReportPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Reporte PDF
            </Button>
        </div>
      </div>

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
          {filteredTransactions.length > 0 ? <Bar data={getChartData()} options={chartOptions} /> : <p className="text-center text-muted-foreground py-10">No hay datos para el periodo seleccionado.</p>}
        </div>
      </div>
      
      {showExpenseForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md border border-border">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground">{editingExpenseId ? 'Editar Egreso' : 'Nuevo Egreso'}</h3>
            <form onSubmit={handleAddOrEditExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Descripción</label>
                <input type="text" value={currentExpense.description} onChange={e => setCurrentExpense({...currentExpense, description: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Monto (MXN)</label>
                <input type="number" value={currentExpense.amount} onChange={e => setCurrentExpense({...currentExpense, amount: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" required min="0.01" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Fecha</label>
                <input type="date" value={currentExpense.date} onChange={e => setCurrentExpense({...currentExpense, date: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Categoría (Opcional)</label>
                <input type="text" value={currentExpense.category || ''} onChange={e => setCurrentExpense({...currentExpense, category: e.target.value})} placeholder="Ej: Renta, Suministros" className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowExpenseForm(false)}>Cancelar</Button>
                <Button type="submit" className="button-primary-gradient">{editingExpenseId ? 'Guardar Cambios' : 'Agregar Egreso'}</Button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Transacciones Recientes (Egresos Manuales)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Descripción</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Categoría</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Monto</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {JSON.parse(localStorage.getItem('clinic_expenses') || '[]').sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5).map(exp => (
                <tr key={exp.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{new Date(exp.date).toLocaleDateString('es-ES')}</td>
                  <td className="px-4 py-2 text-card-foreground">{exp.description}</td>
                  <td className="px-4 py-2 text-muted-foreground">{exp.category || 'N/A'}</td>
                  <td className="px-4 py-2 text-right text-destructive">-${parseFloat(exp.amount).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <Button variant="ghost" size="sm" onClick={() => { setCurrentExpense(exp); setEditingExpenseId(exp.id); setShowExpenseForm(true);}} className="mr-1"><Edit className="w-4 h-4"/></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(exp.id)} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {JSON.parse(localStorage.getItem('clinic_expenses') || '[]').length === 0 && <p className="text-center text-muted-foreground py-4">No hay egresos manuales registrados.</p>}
        </div>
      </div>

    </div>
  );
};

export default FinanceManager;