<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getExpenses();
        break;
    case 'POST':
        createExpense();
        break;
    case 'PUT':
        updateExpense();
        break;
    case 'DELETE':
        deleteExpense();
        break;
    default:
        sendError('Método no permitido', 405);
        break;
}

function getExpenses() {
    try {
        $pdo = getDatabase();
        $stmt = $pdo->query("SELECT * FROM expenses ORDER BY date DESC");
        $expenses = $stmt->fetchAll();
        sendResponse($expenses);
    } catch (Exception $e) {
        sendError('Error al obtener los gastos: ' . $e->getMessage());
    }
}

function createExpense() {
    $data = getRequestData();
    
    if (empty($data['description']) || empty($data['amount']) || empty($data['date'])) {
        sendError('Todos los campos son obligatorios', 400);
        return;
    }

    try {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("
            INSERT INTO expenses (description, amount, category, date)
            VALUES (:description, :amount, :category, :date)
        ");
        
        $stmt->execute([
            ':description' => $data['description'],
            ':amount' => $data['amount'],
            ':category' => $data['category'] ?? 'General',
            ':date' => $data['date'],
        ]);
        
        $newExpenseId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
        $stmt->execute([$newExpenseId]);
        $newExpense = $stmt->fetch();

        sendResponse($newExpense, 201);

    } catch (Exception $e) {
        sendError('Error al crear el gasto: ' . $e->getMessage());
    }
}

function updateExpense() {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendError('ID de gasto no proporcionado', 400);
        return;
    }

    $data = getRequestData();

    try {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("
            UPDATE expenses 
            SET description = :description, amount = :amount, category = :category, date = :date 
            WHERE id = :id
        ");

        $stmt->execute([
            ':id' => $id,
            ':description' => $data['description'],
            ':amount' => $data['amount'],
            ':category' => $data['category'],
            ':date' => $data['date'],
        ]);

        $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        $updatedExpense = $stmt->fetch();

        sendResponse($updatedExpense);

    } catch (Exception $e) {
        sendError('Error al actualizar el gasto: ' . $e->getMessage());
    }
}

function deleteExpense() {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendError('ID de gasto no proporcionado', 400);
        return;
    }

    try {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            sendResponse(['success' => true, 'message' => 'Gasto eliminado correctamente']);
        } else {
            sendError('El gasto no fue encontrado', 404);
        }
    } catch (Exception $e) {
        sendError('Error al eliminar el gasto: ' . $e->getMessage());
    }
}

?>
