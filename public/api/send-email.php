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

// Configuración SMTP de Gmail
$smtpConfig = [
    'host' => 'smtp.gmail.com',
    'port' => 587,
    'username' => $data['smtp_user'] ?? '',
    'password' => $data['smtp_password'] ?? '',
    'from_email' => $data['from_email'] ?? $data['smtp_user'],
    'from_name' => $data['from_name'] ?? 'Clínica Delux'
];

// Validar configuración SMTP
if (empty($smtpConfig['username']) || empty($smtpConfig['password'])) {
    sendError('Configuración SMTP incompleta', 400);
}

try {
    // Usar PHPMailer si está disponible, sino usar mail() nativo
    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        $result = sendWithPHPMailer($data, $smtpConfig);
    } else {
        $result = sendWithNativePHP($data, $smtpConfig);
    }
    
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
            'messageId' => $result['messageId'] ?? uniqid()
        ]);
    } else {
        // Guardar error en historial
        saveEmailHistory([
            'type' => $data['type'] ?? 'manual',
            'recipient' => $data['to'],
            'subject' => $data['subject'],
            'status' => 'error'
        ]);
        
        sendError($result['error'], 500);
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

function sendWithNativePHP($data, $smtpConfig) {
    // Configurar headers para SMTP
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $smtpConfig['from_name'] . ' <' . $smtpConfig['from_email'] . '>',
        'Reply-To: ' . $smtpConfig['from_email'],
        'X-Mailer: PHP/' . phpversion(),
        'X-Priority: 3',
        'X-MSMail-Priority: Normal'
    ];
    
    // Configurar parámetros adicionales para Gmail SMTP
    ini_set('SMTP', $smtpConfig['host']);
    ini_set('smtp_port', $smtpConfig['port']);
    ini_set('sendmail_from', $smtpConfig['from_email']);
    
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
        return ['success' => false, 'error' => 'Error al enviar con mail() nativo'];
    }
}

function sendWithPHPMailer($data, $smtpConfig) {
    // Esta función se implementaría si PHPMailer está disponible
    return ['success' => false, 'error' => 'PHPMailer no disponible'];
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
        // Si falla MySQL, no hacer nada (el email ya se envió)
        error_log('Error guardando historial de email: ' . $e->getMessage());
    }
}
?>