<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$disciplineId = isset($_GET['id']) ? $_GET['id'] : null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($disciplineId) {
                $stmt = $pdo->prepare("SELECT * FROM disciplines WHERE id = ?");
                $stmt->execute([$disciplineId]);
                $discipline = $stmt->fetch();
                
                if (!$discipline) {
                    logApiActivity('disciplines', 'GET', 404, "Discipline not found: ID $disciplineId");
                    sendError('Discipline not found', 404);
                }
                
                logApiActivity('disciplines', 'GET', 200, "Retrieved discipline: ID $disciplineId");
                sendResponse($discipline);
            } else {
                // Agregar filtro opcional por activos
                $activeOnly = isset($_GET['active_only']) && $_GET['active_only'] === '1';
                
                if ($activeOnly) {
                    $stmt = $pdo->query("SELECT * FROM disciplines WHERE active = 1 ORDER BY name");
                } else {
                    $stmt = $pdo->query("SELECT * FROM disciplines ORDER BY name");
                }
                
                $disciplines = $stmt->fetchAll();
                logApiActivity('disciplines', 'GET', 200, "Retrieved all disciplines: " . count($disciplines) . " records" . ($activeOnly ? " (active only)" : ""));
                sendResponse($disciplines);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            if (!isset($data['name'])) {
                logApiActivity('disciplines', 'POST', 400, "Missing required field: name");
                sendError('Missing required field: name', 400);
            }
            
            // Generar ID único basado en el nombre
            $id = isset($data['id']) ? $data['id'] : strtolower(str_replace([' ', 'í', 'ó', 'ú', 'á', 'é', 'ñ'], ['_', 'i', 'o', 'u', 'a', 'e', 'n'], $data['name']));
            
            // Verificar que el ID no exista
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM disciplines WHERE id = ?");
            $stmt->execute([$id]);
            $exists = $stmt->fetch()['count'] > 0;
            
            if ($exists) {
                // Agregar número para hacer único
                $counter = 1;
                $originalId = $id;
                do {
                    $id = $originalId . '_' . $counter;
                    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM disciplines WHERE id = ?");
                    $stmt->execute([$id]);
                    $exists = $stmt->fetch()['count'] > 0;
                    $counter++;
                } while ($exists);
            }
            
            $description = isset($data['description']) ? $data['description'] : null;
            $active = isset($data['active']) ? (int)$data['active'] : 1;
            
            $stmt = $pdo->prepare("INSERT INTO disciplines (id, name, description, active) VALUES (?, ?, ?, ?)");
            $stmt->execute([$id, $data['name'], $description, $active]);
            
            $stmt = $pdo->prepare("SELECT * FROM disciplines WHERE id = ?");
            $stmt->execute([$id]);
            $discipline = $stmt->fetch();
            
            logApiActivity('disciplines', 'POST', 201, "Created discipline: ID " . $id);
            sendResponse($discipline, 201);
            break;
            
        case 'PUT':
            if (!$disciplineId) {
                logApiActivity('disciplines', 'PUT', 400, "Discipline ID required");
                sendError('Discipline ID required', 400);
            }
            
            $data = getRequestData();
            
            if (!isset($data['name'])) {
                logApiActivity('disciplines', 'PUT', 400, "Missing required field: name");
                sendError('Missing required field: name', 400);
            }
            
            // Construir la consulta de actualización dinámicamente
            $updateFields = ['name = ?'];
            $updateValues = [$data['name']];
            
            if (isset($data['description'])) {
                $updateFields[] = 'description = ?';
                $updateValues[] = $data['description'];
            }
            
            if (isset($data['active'])) {
                $updateFields[] = 'active = ?';
                $updateValues[] = (int)$data['active'];
            }
            
            $updateValues[] = $disciplineId; // Para el WHERE
            
            $sql = "UPDATE disciplines SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($updateValues);
            
            $stmt = $pdo->prepare("SELECT * FROM disciplines WHERE id = ?");
            $stmt->execute([$disciplineId]);
            $discipline = $stmt->fetch();
            
            if (!$discipline) {
                logApiActivity('disciplines', 'PUT', 404, "Discipline not found after update: ID $disciplineId");
                sendError('Discipline not found', 404);
            }
            
            logApiActivity('disciplines', 'PUT', 200, "Updated discipline: ID $disciplineId");
            sendResponse($discipline);
            break;
            
        case 'DELETE':
            if (!$disciplineId) {
                logApiActivity('disciplines', 'DELETE', 400, "Discipline ID required");
                sendError('Discipline ID required', 400);
            }
            
            // Verificar si está en uso
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM professionals WHERE discipline_id = ?");
            $stmt->execute([$disciplineId]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                logApiActivity('disciplines', 'DELETE', 400, "Cannot delete discipline: in use by professionals");
                sendError('Cannot delete discipline: it is assigned to one or more professionals', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM disciplines WHERE id = ?");
            $stmt->execute([$disciplineId]);
            
            logApiActivity('disciplines', 'DELETE', 200, "Deleted discipline: ID $disciplineId");
            sendResponse(['success' => true]);
            break;
            
        default:
            logApiActivity('disciplines', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('disciplines', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}
?>