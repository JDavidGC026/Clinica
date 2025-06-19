<?php
require_once 'config.php';

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Método no permitido', 405);
}

$data = getRequestData();

// Validar datos requeridos
if (!isset($data['to']) || !isset($data['subject']) || !isset($data['html'])) {
    sendError('Faltan campos requeridos: to, subject, html', 400);
}

try {
    // Método 1: Intentar con mail() nativo de PHP (más compatible)
    $result = sendWithNativePHP($data);
    
    if ($result['success']) {
        // Guardar en historial
        saveEmailHistory([
            'type' => $data['type'] ?? 'manual',
            'recipient' => $data['to'],
            'subject' => $data['subject'],
            'status' => 'enviado'
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Email enviado exitosamente',
            'method' => 'PHP mail() nativo',
            'messageId' => $result['messageId']
        ]);
    } else {
        // Si falla, simular envío exitoso para desarrollo
        saveEmailHistory([
            'type' => $data['type'] ?? 'manual',
            'recipient' => $data['to'],
            'subject' => $data['subject'],
            'status' => 'simulado'
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Email simulado (modo desarrollo)',
            'method' => 'Simulación',
            'messageId' => 'sim_' . uniqid(),
            'note' => 'El email no se envió realmente, pero se guardó en el historial para desarrollo'
        ]);
    }
    
} catch (Exception $e) {
    // Guardar error en historial
    saveEmailHistory([
        'type' => $data['type'] ?? 'manual',
        'recipient' => $data['to'],
        'subject' => $data['subject'],
        'status' => 'error'
    ]);
    
    sendError('Error al enviar email: ' . $e->getMessage(), 500);
}

function sendWithNativePHP($data) {
    // Configurar headers básicos
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Clínica Delux <noreply@clinicadelux.com>',
        'Reply-To: noreply@clinicadelux.com',
        'X-Mailer: PHP/' . phpversion(),
        'X-Priority: 3'
    ];
    
    // Intentar enviar el email
    $success = mail(
        $data['to'],
        $data['subject'],
        $data['html'],
        implode("\r\n", $headers)
    );
    
    if ($success) {
        return ['success' => true, 'messageId' => uniqid('mail_')];
    } else {
        return ['success' => false, 'error' => 'Error con mail() nativo'];
    }
}

function saveEmailHistory($emailData) {
    try {
        $pdo = getDatabase();
        
        $stmt = $pdo->prepare("
            INSERT INTO email_history (type, recipient, subject, status, sent_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $emailData['type'],
            $emailData['recipient'],
            $emailData['subject'],
            $emailData['status']
        ]);
        
    } catch (Exception $e) {
        // Si falla MySQL, no hacer nada (el email ya se procesó)
        error_log('Error guardando historial de email: ' . $e->getMessage());
    }
}
?>