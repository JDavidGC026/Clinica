<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$disciplineId = $pathParts[2] ?? null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($disciplineId) {
                $stmt = $pdo->prepare("SELECT * FROM disciplines WHERE id = ?");
                $stmt->execute([$disciplineId]);
                $discipline = $stmt->fetch();
                
                if (!$discipline) {
                    sendError('Discipline not found', 404);
                }
                
                sendResponse($discipline);
            } else {
                $stmt = $pdo->query("SELECT * FROM disciplines ORDER BY name");
                $disciplines = $stmt->fetchAll();
                sendResponse($disciplines);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            if (!isset($data['id']) || !isset($data['name'])) {
                sendError('Missing required fields: id, name', 400);
            }
            
            $stmt = $pdo->prepare("INSERT INTO disciplines (id, name) VALUES (?, ?)");
            $stmt->execute([$data['id'], $data['name']]);
            
            $stmt = $pdo->prepare("SELECT * FROM disciplines WHERE id = ?");
            $stmt->execute([$data['id']]);
            $discipline = $stmt->fetch();
            
            sendResponse($discipline, 201);
            break;
            
        case 'PUT':
            if (!$disciplineId) {
                sendError('Discipline ID required', 400);
            }
            
            $data = getRequestData();
            
            if (!isset($data['name'])) {
                sendError('Missing required field: name', 400);
            }
            
            $stmt = $pdo->prepare("UPDATE disciplines SET name = ? WHERE id = ?");
            $stmt->execute([$data['name'], $disciplineId]);
            
            $stmt = $pdo->prepare("SELECT * FROM disciplines WHERE id = ?");
            $stmt->execute([$disciplineId]);
            $discipline = $stmt->fetch();
            
            sendResponse($discipline);
            break;
            
        case 'DELETE':
            if (!$disciplineId) {
                sendError('Discipline ID required', 400);
            }
            
            // Verificar si está en uso
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM professionals WHERE discipline_id = ?");
            $stmt->execute([$disciplineId]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                sendError('Cannot delete discipline: it is assigned to one or more professionals', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM disciplines WHERE id = ?");
            $stmt->execute([$disciplineId]);
            
            sendResponse(['success' => true]);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError($e->getMessage());
}
?>