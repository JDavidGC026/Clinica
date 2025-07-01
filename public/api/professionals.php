<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$professionalId = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($professionalId) {
                $stmt = $pdo->prepare("
                    SELECT p.*, d.name as discipline_name 
                    FROM professionals p 
                    LEFT JOIN disciplines d ON p.discipline_id = d.id 
                    WHERE p.id = ?
                ");
                $stmt->execute([$professionalId]);
                $professional = $stmt->fetch();
                
                if (!$professional) {
                    logApiActivity('professionals', 'GET', 404, "Professional not found: ID $professionalId");
                    sendError('Professional not found', 404);
                }
                
                // Decodificar JSON del schedule
                if ($professional['schedule']) {
                    $professional['schedule'] = json_decode($professional['schedule'], true);
                }
                
                // Mapear discipline_id a disciplineId para compatibilidad con frontend
                $professional['disciplineId'] = $professional['discipline_id'];
                
                logApiActivity('professionals', 'GET', 200, "Retrieved professional: ID $professionalId");
                sendResponse($professional);
            } else {
                $stmt = $pdo->query("
                    SELECT p.*, d.name as discipline_name 
                    FROM professionals p 
                    LEFT JOIN disciplines d ON p.discipline_id = d.id 
                    ORDER BY p.name
                ");
                $professionals = $stmt->fetchAll();
                
                // Decodificar JSON del schedule para cada profesional y mapear campos
                foreach ($professionals as &$professional) {
                    if ($professional['schedule']) {
                        $professional['schedule'] = json_decode($professional['schedule'], true);
                    }
                    // Mapear discipline_id a disciplineId para compatibilidad con frontend
                    $professional['disciplineId'] = $professional['discipline_id'];
                }
                
                logApiActivity('professionals', 'GET', 200, "Retrieved all professionals: " . count($professionals) . " records");
                sendResponse($professionals);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            $requiredFields = ['name', 'email', 'phone', 'disciplineId', 'schedule'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    logApiActivity('professionals', 'POST', 400, "Missing required field: $field");
                    sendError("Missing required field: $field", 400);
                }
            }
            
            // Mapear disciplineId a discipline_id
            $disciplineId = $data['disciplineId'] ?? $data['discipline_id'];
            
            // Generar contraseña por defecto si no se proporciona
            $password = $data['password'] ?? 'password123';
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            $stmt = $pdo->prepare("
                INSERT INTO professionals 
                (name, email, phone, discipline_id, schedule, password_hash) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'],
                $disciplineId,
                json_encode($data['schedule']),
                $passwordHash
            ]);
            
            $professionalId = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare("
                SELECT p.*, d.name as discipline_name 
                FROM professionals p 
                LEFT JOIN disciplines d ON p.discipline_id = d.id 
                WHERE p.id = ?
            ");
            $stmt->execute([$professionalId]);
            $professional = $stmt->fetch();
            
            if ($professional['schedule']) {
                $professional['schedule'] = json_decode($professional['schedule'], true);
            }
            
            // Mapear discipline_id a disciplineId para compatibilidad con frontend
            $professional['disciplineId'] = $professional['discipline_id'];
            
            logApiActivity('professionals', 'POST', 201, "Created professional: ID $professionalId");
            sendResponse($professional, 201);
            break;
            
        case 'PUT':
            if (!$professionalId) {
                logApiActivity('professionals', 'PUT', 400, "Professional ID required");
                sendError('Professional ID required', 400);
            }
            
            $data = getRequestData();
            
            // Mapear disciplineId a discipline_id
            $disciplineId = $data['disciplineId'] ?? $data['discipline_id'];
            
            // Preparar campos para actualizar
            $updateFields = [
                $data['name'],
                $data['email'],
                $data['phone'],
                $disciplineId,
                json_encode($data['schedule'])
            ];
            
            $sql = "UPDATE professionals SET name = ?, email = ?, phone = ?, discipline_id = ?, schedule = ?";
            
            // Si se proporciona nueva contraseña, incluirla
            if (isset($data['password']) && !empty($data['password'])) {
                $sql .= ", password_hash = ?";
                $updateFields[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            $sql .= " WHERE id = ?";
            $updateFields[] = $professionalId;
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($updateFields);
            
            $stmt = $pdo->prepare("
                SELECT p.*, d.name as discipline_name 
                FROM professionals p 
                LEFT JOIN disciplines d ON p.discipline_id = d.id 
                WHERE p.id = ?
            ");
            $stmt->execute([$professionalId]);
            $professional = $stmt->fetch();
            
            if ($professional['schedule']) {
                $professional['schedule'] = json_decode($professional['schedule'], true);
            }
            
            // Mapear discipline_id a disciplineId para compatibilidad con frontend
            $professional['disciplineId'] = $professional['discipline_id'];
            
            logApiActivity('professionals', 'PUT', 200, "Updated professional: ID $professionalId");
            sendResponse($professional);
            break;
            
        case 'DELETE':
            if (!$professionalId) {
                logApiActivity('professionals', 'DELETE', 400, "Professional ID required");
                sendError('Professional ID required', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM professionals WHERE id = ?");
            $stmt->execute([$professionalId]);
            
            logApiActivity('professionals', 'DELETE', 200, "Deleted professional: ID $professionalId");
            sendResponse(['success' => true]);
            break;
            
        default:
            logApiActivity('professionals', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('professionals', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}
?>