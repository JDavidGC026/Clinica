<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$appointmentId = $pathParts[2] ?? null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($appointmentId) {
                $stmt = $pdo->prepare("
                    SELECT a.*, p.name as patient_full_name, pr.name as professional_full_name
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN professionals pr ON a.professional_id = pr.id
                    WHERE a.id = ?
                ");
                $stmt->execute([$appointmentId]);
                $appointment = $stmt->fetch();
                
                if (!$appointment) {
                    sendError('Appointment not found', 404);
                }
                
                sendResponse($appointment);
            } else {
                $stmt = $pdo->query("
                    SELECT a.*, p.name as patient_full_name, pr.name as professional_full_name
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN professionals pr ON a.professional_id = pr.id
                    ORDER BY a.date DESC, a.time ASC
                ");
                $appointments = $stmt->fetchAll();
                sendResponse($appointments);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            $requiredFields = ['patientName', 'patientEmail', 'professionalId', 'date', 'time', 'type'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    sendError("Missing required field: $field", 400);
                }
            }
            
            // Buscar paciente por email
            $patientId = null;
            $stmt = $pdo->prepare("SELECT id FROM patients WHERE email = ?");
            $stmt->execute([$data['patientEmail']]);
            $patient = $stmt->fetch();
            if ($patient) {
                $patientId = $patient['id'];
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO appointments 
                (patient_id, patient_name, patient_email, patient_phone, professional_id, 
                 professional_name, date, time, type, notes, status, payment_status, cost, folio) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $patientId,
                $data['patientName'],
                $data['patientEmail'],
                $data['patientPhone'] ?? null,
                $data['professionalId'],
                $data['professionalName'] ?? null,
                $data['date'],
                $data['time'],
                $data['type'],
                $data['notes'] ?? null,
                $data['status'] ?? 'programada',
                $data['paymentStatus'] ?? 'pendiente',
                $data['cost'] ?? null,
                $data['folio'] ?? null
            ]);
            
            $appointmentId = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare("
                SELECT a.*, p.name as patient_full_name, pr.name as professional_full_name
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN professionals pr ON a.professional_id = pr.id
                WHERE a.id = ?
            ");
            $stmt->execute([$appointmentId]);
            $appointment = $stmt->fetch();
            
            sendResponse($appointment, 201);
            break;
            
        case 'PUT':
            if (!$appointmentId) {
                sendError('Appointment ID required', 400);
            }
            
            $data = getRequestData();
            
            // Buscar paciente por email
            $patientId = null;
            if (isset($data['patientEmail'])) {
                $stmt = $pdo->prepare("SELECT id FROM patients WHERE email = ?");
                $stmt->execute([$data['patientEmail']]);
                $patient = $stmt->fetch();
                if ($patient) {
                    $patientId = $patient['id'];
                }
            }
            
            $stmt = $pdo->prepare("
                UPDATE appointments 
                SET patient_id = ?, patient_name = ?, patient_email = ?, patient_phone = ?, 
                    professional_id = ?, professional_name = ?, date = ?, time = ?, 
                    type = ?, notes = ?, status = ?, payment_status = ?, cost = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $patientId,
                $data['patientName'],
                $data['patientEmail'],
                $data['patientPhone'] ?? null,
                $data['professionalId'],
                $data['professionalName'] ?? null,
                $data['date'],
                $data['time'],
                $data['type'],
                $data['notes'] ?? null,
                $data['status'] ?? 'programada',
                $data['paymentStatus'] ?? 'pendiente',
                $data['cost'] ?? null,
                $appointmentId
            ]);
            
            $stmt = $pdo->prepare("
                SELECT a.*, p.name as patient_full_name, pr.name as professional_full_name
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN professionals pr ON a.professional_id = pr.id
                WHERE a.id = ?
            ");
            $stmt->execute([$appointmentId]);
            $appointment = $stmt->fetch();
            
            sendResponse($appointment);
            break;
            
        case 'DELETE':
            if (!$appointmentId) {
                sendError('Appointment ID required', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = ?");
            $stmt->execute([$appointmentId]);
            
            sendResponse(['success' => true]);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError($e->getMessage());
}
?>