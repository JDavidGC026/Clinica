<?php
require_once 'config.php';

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Método no permitido', 405);
}

$data = getRequestData();

// Validar datos requeridos
$required = ['to', 'subject', 'html', 'smtp_user', 'smtp_password'];
foreach ($required as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        sendError("Campo requerido faltante: $field", 400);
    }
}

try {
    // Usar cURL para enviar via SMTP de Gmail
    $result = sendEmailViaCurl($data);
    
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
            'message' => 'Email enviado exitosamente via Gmail SMTP',
            'messageId' => $result['messageId']
        ]);
    } else {
        saveEmailHistory([
            'type' => $data['type'] ?? 'manual',
            'recipient' => $data['to'],
            'subject' => $data['subject'],
            'status' => 'error'
        ]);
        
        sendError($result['error'], 500);
    }
    
} catch (Exception $e) {
    saveEmailHistory([
        'type' => $data['type'] ?? 'manual',
        'recipient' => $data['to'],
        'subject' => $data['subject'],
        'status' => 'error'
    ]);
    
    sendError('Error al enviar email: ' . $e->getMessage(), 500);
}

function sendEmailViaCurl($data) {
    // Preparar el mensaje SMTP
    $boundary = uniqid('boundary_');
    $messageId = uniqid() . '@clinicadelux.com';
    
    $smtpMessage = buildSMTPMessage($data, $boundary, $messageId);
    
    // Configurar cURL para SMTP
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => 'smtps://smtp.gmail.com:465',
        CURLOPT_USE_SSL => CURLUSESSL_ALL,
        CURLOPT_USERNAME => $data['smtp_user'],
        CURLOPT_PASSWORD => $data['smtp_password'],
        CURLOPT_MAIL_FROM => $data['from_email'] ?? $data['smtp_user'],
        CURLOPT_MAIL_RCPT => [$data['to']],
        CURLOPT_READDATA => $smtpMessage,
        CURLOPT_UPLOAD => true,
        CURLOPT_VERBOSE => false,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($result === false || !empty($error)) {
        return [
            'success' => false,
            'error' => 'Error CURL: ' . ($error ?: 'Error desconocido')
        ];
    }
    
    return [
        'success' => true,
        'messageId' => $messageId,
        'response' => $result
    ];
}

function buildSMTPMessage($data, $boundary, $messageId) {
    $fromEmail = $data['from_email'] ?? $data['smtp_user'];
    $fromName = $data['from_name'] ?? 'Clínica Delux';
    $date = date('r');
    
    $message = "Message-ID: <$messageId>\r\n";
    $message .= "Date: $date\r\n";
    $message .= "From: $fromName <$fromEmail>\r\n";
    $message .= "To: {$data['to']}\r\n";
    $message .= "Subject: {$data['subject']}\r\n";
    $message .= "MIME-Version: 1.0\r\n";
    $message .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
    $message .= "X-Mailer: Clínica Delux System\r\n";
    $message .= "X-Priority: 3\r\n\r\n";
    
    // Parte de texto plano
    $message .= "--$boundary\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= strip_tags($data['html']) . "\r\n\r\n";
    
    // Parte HTML
    $message .= "--$boundary\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $data['html'] . "\r\n\r\n";
    
    $message .= "--$boundary--\r\n";
    
    return $message;
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
        error_log('Error guardando historial de email: ' . $e->getMessage());
    }
}
?>