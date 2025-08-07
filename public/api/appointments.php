<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$appointmentId = isset($_GET['id']) ? $_GET['id'] : null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($appointmentId) {
                $stmt = $pdo->prepare("
                    SELECT a.*, 
                           p.name as patient_full_name,
                           p.email as patient_email_db,
                           p.phone as patient_phone_db,
                           p.age as patient_age,
                           p.gender as patient_gender,
                           pr.name as professional_full_name,
                           pr.email as professional_email,
                           pr.phone as professional_phone,
                           pr.discipline_id,
                           d.name as discipline_name
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN professionals pr ON a.professional_id = pr.id
                    LEFT JOIN disciplines d ON pr.discipline_id = d.id
                    WHERE a.id = ?
                ");
                $stmt->execute([$appointmentId]);
                $appointment = $stmt->fetch();
                
                if (!$appointment) {
                    logApiActivity('appointments', 'GET', 404, "Appointment not found: ID $appointmentId");
                    sendError('Appointment not found', 404);
                }
                
                // Enriquecer datos del paciente
                $appointment = enrichAppointmentData($appointment);
                
                logApiActivity('appointments', 'GET', 200, "Retrieved appointment: ID $appointmentId");
                sendResponse($appointment);
            } else {
                $stmt = $pdo->query("
                    SELECT a.*, 
                           p.name as patient_full_name,
                           p.email as patient_email_db,
                           p.phone as patient_phone_db,
                           p.age as patient_age,
                           p.gender as patient_gender,
                           pr.name as professional_full_name,
                           pr.email as professional_email,
                           pr.phone as professional_phone,
                           pr.discipline_id,
                           d.name as discipline_name
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN professionals pr ON a.professional_id = pr.id
                    LEFT JOIN disciplines d ON pr.discipline_id = d.id
                    ORDER BY a.date DESC, a.time ASC
                ");
                $appointments = $stmt->fetchAll();
                
                // Enriquecer datos para todas las citas
                foreach ($appointments as &$appointment) {
                    $appointment = enrichAppointmentData($appointment);
                }
                
                logApiActivity('appointments', 'GET', 200, "Retrieved all appointments: " . count($appointments) . " records");
                sendResponse($appointments);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            $requiredFields = ['patientName', 'patientEmail', 'professionalId', 'date', 'time', 'type'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    logApiActivity('appointments', 'POST', 400, "Missing required field: $field");
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
            
            // Obtener información completa del profesional
            $professionalName = null;
            if ($data['professionalId']) {
                $stmt = $pdo->prepare("SELECT name FROM professionals WHERE id = ?");
                $stmt->execute([$data['professionalId']]);
                $professional = $stmt->fetch();
                if ($professional) {
                    $professionalName = $professional['name'];
                }
            }
            
            // Generar folio si no se proporciona
            $folio = $data['folio'] ?? generateFolio();
            
            $stmt = $pdo->prepare("
                INSERT INTO appointments 
                (patient_id, patient_name, patient_email, patient_phone, professional_id, 
                 professional_name, date, time, type, notes, status, 
                 payment_status, cost, folio) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $patientId,
                $data['patientName'],
                $data['patientEmail'],
                $data['patientPhone'] ?? null,
                $data['professionalId'],
                $professionalName,
                $data['date'],
                $data['time'],
                $data['type'],
                $data['notes'] ?? null,
                $data['status'] ?? 'programada',
                $data['paymentStatus'] ?? 'pendiente',
                $data['cost'] ?? '0.00',
                $folio
            ]);
            
            $appointmentId = $pdo->lastInsertId();
            
            // Obtener la cita completa con todos los datos
            $stmt = $pdo->prepare("
                SELECT a.*, 
                       p.name as patient_full_name,
                       p.email as patient_email_db,
                       p.phone as patient_phone_db,
                       p.age as patient_age,
                       p.gender as patient_gender,
                       pr.name as professional_full_name,
                       pr.email as professional_email,
                       pr.phone as professional_phone,
                       pr.discipline_id,
                       d.name as discipline_name
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN professionals pr ON a.professional_id = pr.id
                LEFT JOIN disciplines d ON pr.discipline_id = d.id
                WHERE a.id = ?
            ");
            $stmt->execute([$appointmentId]);
            $appointment = $stmt->fetch();
            
            $appointment = enrichAppointmentData($appointment);
            
            logApiActivity('appointments', 'POST', 201, "Created appointment: ID $appointmentId");
            sendResponse($appointment, 201);
            break;
            
        case 'PUT':
            if (!$appointmentId) {
                logApiActivity('appointments', 'PUT', 400, "Appointment ID required");
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
            
            // Obtener información completa del profesional
            $professionalName = null;
            if (isset($data['professionalId']) && $data['professionalId']) {
                $stmt = $pdo->prepare("SELECT name FROM professionals WHERE id = ?");
                $stmt->execute([$data['professionalId']]);
                $professional = $stmt->fetch();
                if ($professional) {
                    $professionalName = $professional['name'];
                }
            }
            
            $stmt = $pdo->prepare("
                UPDATE appointments 
                SET patient_id = ?, patient_name = ?, patient_email = ?, patient_phone = ?, 
                    professional_id = ?, professional_name = ?, 
                    date = ?, time = ?, type = ?, notes = ?, status = ?, payment_status = ?, cost = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $patientId,
                $data['patientName'],
                $data['patientEmail'],
                $data['patientPhone'] ?? null,
                $data['professionalId'],
                $professionalName,
                $data['date'],
                $data['time'],
                $data['type'],
                $data['notes'] ?? null,
                $data['status'] ?? 'programada',
                $data['paymentStatus'] ?? 'pendiente',
                $data['cost'] ?? '0.00',
                $appointmentId
            ]);
            
            // Obtener la cita actualizada con todos los datos
            $stmt = $pdo->prepare("
                SELECT a.*, 
                       p.name as patient_full_name,
                       p.email as patient_email_db,
                       p.phone as patient_phone_db,
                       p.age as patient_age,
                       p.gender as patient_gender,
                       pr.name as professional_full_name,
                       pr.email as professional_email,
                       pr.phone as professional_phone,
                       pr.discipline_id,
                       d.name as discipline_name
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN professionals pr ON a.professional_id = pr.id
                LEFT JOIN disciplines d ON pr.discipline_id = d.id
                WHERE a.id = ?
            ");
            $stmt->execute([$appointmentId]);
            $appointment = $stmt->fetch();
            
            $appointment = enrichAppointmentData($appointment);
            
            logApiActivity('appointments', 'PUT', 200, "Updated appointment: ID $appointmentId");
            sendResponse($appointment);
            break;
            
        case 'DELETE':
            if (!$appointmentId) {
                logApiActivity('appointments', 'DELETE', 400, "Appointment ID required");
                sendError('Appointment ID required', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = ?");
            $stmt->execute([$appointmentId]);
            
            logApiActivity('appointments', 'DELETE', 200, "Deleted appointment: ID $appointmentId");
            sendResponse(['success' => true]);
            break;
            
        default:
            logApiActivity('appointments', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('appointments', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}

function enrichAppointmentData($appointment) {
    // Asegurar que los nombres estén disponibles
    if (!$appointment['patient_name'] && $appointment['patient_full_name']) {
        $appointment['patient_name'] = $appointment['patient_full_name'];
    }
    if (!$appointment['professional_name'] && $appointment['professional_full_name']) {
        $appointment['professional_name'] = $appointment['professional_full_name'];
    }
    
    // Usar email de la base de datos si está disponible
    if (!$appointment['patient_email'] && $appointment['patient_email_db']) {
        $appointment['patient_email'] = $appointment['patient_email_db'];
    }
    if (!$appointment['patient_phone'] && $appointment['patient_phone_db']) {
        $appointment['patient_phone'] = $appointment['patient_phone_db'];
    }
    
    // Asegurar valores por defecto
    $appointment['payment_status'] = $appointment['payment_status'] ?: 'pendiente';
    $appointment['status'] = $appointment['status'] ?: 'programada';
    $appointment['cost'] = $appointment['cost'] ?: '0.00';
    
    // Agregar información adicional del paciente
    $appointment['patient_info'] = [
        'age' => $appointment['patient_age'],
        'gender' => $appointment['patient_gender'],
        'email' => $appointment['patient_email'],
        'phone' => $appointment['patient_phone']
    ];
    
    // Agregar información adicional del profesional
    $appointment['professional_info'] = [
        'email' => $appointment['professional_email'],
        'phone' => $appointment['professional_phone'],
        'discipline' => $appointment['discipline_name'],
        'discipline_id' => $appointment['discipline_id']
    ];
    
    return $appointment;
}

function generateFolio() {
    $prefix = "CDX"; // Clínica Delux
    $date = new DateTime();
    $year = $date->format('y');
    $month = $date->format('m');
    $day = $date->format('d');
    $randomSuffix = strtoupper(substr(uniqid(), -4));
    return "{$prefix}-{$year}{$month}{$day}-{$randomSuffix}";
}
?>