<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$patientId = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($patientId) {
                $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = ?");
                $stmt->execute([$patientId]);
                $patient = $stmt->fetch();
                
                if (!$patient) {
                    logApiActivity('patients', 'GET', 404, "Patient not found: ID $patientId");
                    sendError('Patient not found', 404);
                }
                
                logApiActivity('patients', 'GET', 200, "Retrieved patient: ID $patientId");
                sendResponse($patient);
            } else {
                $stmt = $pdo->query("SELECT * FROM patients ORDER BY name");
                $patients = $stmt->fetchAll();
                logApiActivity('patients', 'GET', 200, "Retrieved all patients: " . count($patients) . " records");
                sendResponse($patients);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            $requiredFields = ['name', 'email'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    logApiActivity('patients', 'POST', 400, "Missing required field: $field");
                    sendError("Missing required field: $field", 400);
                }
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO patients 
                (name, email, phone, age, gender, address, emergency_contact, 
                 emergency_phone, medical_history, allergies, medications, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? null,
                $data['age'] ?? null,
                $data['gender'] ?? null,
                $data['address'] ?? null,
                $data['emergencyContact'] ?? null,
                $data['emergencyPhone'] ?? null,
                $data['medicalHistory'] ?? null,
                $data['allergies'] ?? null,
                $data['medications'] ?? null,
                $data['notes'] ?? null
            ]);
            
            $patientId = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = ?");
            $stmt->execute([$patientId]);
            $patient = $stmt->fetch();
            
            logApiActivity('patients', 'POST', 201, "Created patient: ID $patientId");
            sendResponse($patient, 201);
            break;
            
        case 'PUT':
            if (!$patientId) {
                logApiActivity('patients', 'PUT', 400, "Patient ID required");
                sendError('Patient ID required', 400);
            }
            
            $data = getRequestData();
            
            $stmt = $pdo->prepare("
                UPDATE patients 
                SET name = ?, email = ?, phone = ?, age = ?, gender = ?, 
                    address = ?, emergency_contact = ?, emergency_phone = ?, 
                    medical_history = ?, allergies = ?, medications = ?, notes = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? null,
                $data['age'] ?? null,
                $data['gender'] ?? null,
                $data['address'] ?? null,
                $data['emergencyContact'] ?? null,
                $data['emergencyPhone'] ?? null,
                $data['medicalHistory'] ?? null,
                $data['allergies'] ?? null,
                $data['medications'] ?? null,
                $data['notes'] ?? null,
                $patientId
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = ?");
            $stmt->execute([$patientId]);
            $patient = $stmt->fetch();
            
            logApiActivity('patients', 'PUT', 200, "Updated patient: ID $patientId");
            sendResponse($patient);
            break;
            
        case 'DELETE':
            if (!$patientId) {
                logApiActivity('patients', 'DELETE', 400, "Patient ID required");
                sendError('Patient ID required', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM patients WHERE id = ?");
            $stmt->execute([$patientId]);
            
            logApiActivity('patients', 'DELETE', 200, "Deleted patient: ID $patientId");
            sendResponse(['success' => true]);
            break;
            
        default:
            logApiActivity('patients', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('patients', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}
?>