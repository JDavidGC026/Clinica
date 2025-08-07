<?php
require_once 'config.php';

try {
    $pdo = getDatabase();
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Obtener notas clínicas por paciente_id y professional_id
            $patient_id = $_GET['patient_id'] ?? null;
            $professional_id = $_GET['professional_id'] ?? null;
            
            if (!$patient_id || !$professional_id) {
                sendError('Se requieren patient_id y professional_id', 400);
            }
            
            $stmt = $pdo->prepare("
                SELECT cn.* 
                FROM clinical_notes cn
                WHERE cn.patient_id = ? AND cn.professional_id = ?
                ORDER BY cn.updated_at DESC
            ");
            
            $stmt->execute([$patient_id, $professional_id]);
            $notes = $stmt->fetch();
            
            logApiActivity('clinical-notes', 'GET', 200, "Retrieved clinical notes for patient $patient_id and professional $professional_id");
            sendResponse($notes ?: ['notes' => '']);
            break;
            
        case 'POST':
            // Crear o actualizar notas clínicas
            $data = getRequestData();
            
            $patient_id = $data['patient_id'] ?? null;
            $professional_id = $data['professional_id'] ?? null;
            $notes = $data['notes'] ?? '';
            
            if (!$patient_id || !$professional_id) {
                sendError('Se requieren patient_id y professional_id', 400);
            }
            
            // Verificar si ya existe una nota para este paciente y profesional
            $stmt = $pdo->prepare("
                SELECT id FROM clinical_notes 
                WHERE patient_id = ? AND professional_id = ?
            ");
            $stmt->execute([$patient_id, $professional_id]);
            $existingNote = $stmt->fetch();
            
            if ($existingNote) {
                // Actualizar nota existente
                $stmt = $pdo->prepare("
                    UPDATE clinical_notes 
                    SET notes = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE patient_id = ? AND professional_id = ?
                ");
                $stmt->execute([$notes, $patient_id, $professional_id]);
                
                logApiActivity('clinical-notes', 'POST', 200, "Updated clinical notes for patient $patient_id and professional $professional_id");
                sendResponse(['success' => true, 'message' => 'Notas clínicas actualizadas exitosamente', 'action' => 'updated']);
            } else {
                // Crear nueva nota
                $stmt = $pdo->prepare("
                    INSERT INTO clinical_notes (patient_id, professional_id, notes) 
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$patient_id, $professional_id, $notes]);
                
                logApiActivity('clinical-notes', 'POST', 200, "Created clinical notes for patient $patient_id and professional $professional_id");
                sendResponse(['success' => true, 'message' => 'Notas clínicas guardadas exitosamente', 'action' => 'created']);
            }
            break;
            
        case 'DELETE':
            // Eliminar notas clínicas
            $data = getRequestData();
            
            $patient_id = $data['patient_id'] ?? null;
            $professional_id = $data['professional_id'] ?? null;
            
            if (!$patient_id || !$professional_id) {
                sendError('Se requieren patient_id y professional_id', 400);
            }
            
            $stmt = $pdo->prepare("
                DELETE FROM clinical_notes 
                WHERE patient_id = ? AND professional_id = ?
            ");
            $stmt->execute([$patient_id, $professional_id]);
            
            logApiActivity('clinical-notes', 'DELETE', 200, "Deleted clinical notes for patient $patient_id and professional $professional_id");
            sendResponse(['success' => true, 'message' => 'Notas clínicas eliminadas exitosamente']);
            break;
            
        default:
            sendError('Método HTTP no permitido', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('clinical-notes', $_SERVER['REQUEST_METHOD'], 500, "Error: " . $e->getMessage());
    sendError('Error en el servidor: ' . $e->getMessage());
}
?>
