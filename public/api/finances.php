<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    getFinanceSummary();
} else {
    sendError('Método no permitido', 405);
}

function getFinanceSummary() {
    $startDate = $_GET['start_date'] ?? date('Y-m-01');
    $endDate = $_GET['end_date'] ?? date('Y-m-t');

    try {
        $pdo = getDatabase();

        // 1. Calcular Ingresos (citas pagadas)
        $incomeStmt = $pdo->prepare("
            SELECT 
                SUM(cost) as total_income,
                COUNT(*) as total_appointments
            FROM appointments
            WHERE payment_status = 'pagado'
            AND date BETWEEN :start_date AND :end_date
        ");
        $incomeStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
        $income = $incomeStmt->fetch();

        // 2. Calcular Egresos (gastos)
        $expenseStmt = $pdo->prepare("
            SELECT 
                SUM(amount) as total_expenses,
                COUNT(*) as total_transactions
            FROM expenses
            WHERE date BETWEEN :start_date AND :end_date
        ");
        $expenseStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
        $expenses = $expenseStmt->fetch();

        // 3. Obtener detalle de ingresos
        $incomeDetailStmt = $pdo->prepare("
            SELECT id, patient_name, date, cost 
            FROM appointments 
            WHERE payment_status = 'pagado' AND date BETWEEN :start_date AND :end_date 
            ORDER BY date DESC
        ");
        $incomeDetailStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
        $income_details = $incomeDetailStmt->fetchAll();

        // 4. Obtener detalle de egresos
        $expenseDetailStmt = $pdo->prepare("
            SELECT id, description, amount, category, date 
            FROM expenses 
            WHERE date BETWEEN :start_date AND :end_date 
            ORDER BY date DESC
        ");
        $expenseDetailStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
        $expense_details = $expenseDetailStmt->fetchAll();
        
        $total_income = $income['total_income'] ?? 0;
        $total_expenses = $expenses['total_expenses'] ?? 0;

        sendResponse([
            'summary' => [
                'total_income' => (float)$total_income,
                'total_expenses' => (float)$total_expenses,
                'net_profit' => (float)($total_income - $total_expenses),
                'total_appointments' => (int)($income['total_appointments'] ?? 0),
                'total_expense_transactions' => (int)($expenses['total_transactions'] ?? 0),
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]
            ],
            'income_details' => $income_details,
            'expense_details' => $expense_details,
        ]);

    } catch (Exception $e) {
        sendError('Error al obtener el resumen financiero: ' . $e->getMessage());
    }
}
?>
