<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$patientId = $pathParts[2] ?? null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($patientId) {
                $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = ?");
                $stmt->execute([$patientId]);
                $patient = $stmt->fetch();
                
                if (!$patient) {
                    sendError('Patient not found', 404);
                }
                
                sendResponse($patient);
            } else {
                $stmt = $pdo->query("SELECT * FROM patients ORDER BY name");
                $patients = $stmt->fetchAll();
                sendResponse($patients);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            $requiredFields = ['name', 'email'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
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
            
            sendResponse($patient, 201);
            break;
            
        case 'PUT':
            if (!$patientId) {
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
            
            sendResponse($patient);
            break;
            
        case 'DELETE':
            if (!$patientId) {
                sendError('Patient ID required', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM patients WHERE id = ?");
            $stmt->execute([$patientId]);
            
            sendResponse(['success' => true]);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError($e->getMessage());
}
?>