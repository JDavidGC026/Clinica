<?php
require_once 'config.php';

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    logApiActivity('phpmailer-send', $_SERVER['REQUEST_METHOD'], 405, "Method not allowed");
    sendError('Método no permitido', 405);
}

$data = getRequestData();

// Validar datos requeridos
$required = ['to', 'subject', 'html', 'smtp_user', 'smtp_password'];
foreach ($required as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        logApiActivity('phpmailer-send', 'POST', 400, "Missing required field: $field");
        sendError("Campo requerido faltante: $field", 400);
    }
}

// Verificar si PHPMailer está disponible
$phpmailerPath = __DIR__ . '/../../vendor/autoload.php';
if (!file_exists($phpmailerPath)) {
    logApiActivity('phpmailer-send', 'POST', 500, "PHPMailer not installed");
    sendError('PHPMailer no está instalado. Ejecuta: composer require phpmailer/phpmailer', 500);
}

require_once $phpmailerPath;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);

    // Configuración del servidor SMTP
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = $data['smtp_user'];
    $mail->Password   = $data['smtp_password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    // Configuración del remitente
    $fromEmail = $data['from_email'] ?? $data['smtp_user'];
    $fromName = $data['from_name'] ?? 'Clínica Delux';
    $mail->setFrom($fromEmail, $fromName);

    // Destinatario
    $mail->addAddress($data['to']);

    // Configuración del email
    $mail->isHTML(true);
    $mail->Subject = $data['subject'];
    $mail->Body    = $data['html'];
    
    // Versión en texto plano (opcional)
    if (isset($data['text'])) {
        $mail->AltBody = $data['text'];
    } else {
        $mail->AltBody = strip_tags($data['html']);
    }

    // Enviar el email
    $mail->send();
    
    // Guardar en historial
    saveEmailHistory([
        'type' => $data['type'] ?? 'manual',
        'recipient' => $data['to'],
        'subject' => $data['subject'],
        'status' => 'enviado'
    ]);

    logApiActivity('phpmailer-send', 'POST', 200, "Email sent successfully to: " . $data['to']);
    sendResponse([
        'success' => true,
        'message' => 'Email enviado exitosamente con PHPMailer',
        'messageId' => $mail->getLastMessageID()
    ]);

} catch (Exception $e) {
    // Guardar error en historial
    saveEmailHistory([
        'type' => $data['type'] ?? 'manual',
        'recipient' => $data['to'],
        'subject' => $data['subject'],
        'status' => 'error'
    ]);

    logApiActivity('phpmailer-send', 'POST', 500, "PHPMailer Error: " . $e->getMessage());
    sendError('Error al enviar email: ' . $e->getMessage(), 500);
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
        
        logApiActivity('email-history', 'INSERT', 200, "Email history saved: " . $emailData['type'] . " to " . $emailData['recipient']);
        
    } catch (Exception $e) {
        error_log('Error guardando historial de email: ' . $e->getMessage());
        logApiActivity('email-history', 'INSERT', 500, "Failed to save email history: " . $e->getMessage());
    }
}
?>