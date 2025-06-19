<?php
/**
 * =====================================================
 * ARCHIVO DE PRUEBA DE ENVÍO DE CORREOS
 * Clínica Delux - Sistema de Gestión Médica
 * =====================================================
 * 
 * INSTRUCCIONES DE USO:
 * 
 * 1. Configura tu cuenta de Gmail:
 *    - Ve a https://myaccount.google.com/security
 *    - Habilita "Verificación en 2 pasos"
 *    - Genera una "Contraseña de aplicación" específica
 * 
 * 2. Edita las variables de configuración abajo
 * 
 * 3. Ejecuta este archivo desde el navegador:
 *    http://tu-dominio.com/test-email.php
 * 
 * 4. O desde línea de comandos:
 *    php test-email.php
 * 
 * =====================================================
 */

// =====================================================
// CONFIGURACIÓN - EDITA ESTOS VALORES
// =====================================================

$GMAIL_USER = 'tu-email@gmail.com';           // Tu email de Gmail
$GMAIL_PASSWORD = 'tu-password-de-aplicacion'; // Contraseña de aplicación de Gmail
$TEST_RECIPIENT = 'destinatario@email.com';    // Email de prueba donde enviar
$CLINIC_NAME = 'Clínica Delux';                // Nombre de la clínica

// =====================================================
// NO EDITES NADA DEBAJO DE ESTA LÍNEA
// =====================================================

// Configurar zona horaria de México
date_default_timezone_set('America/Mexico_City');

// Headers para respuesta JSON si se ejecuta desde navegador
if (isset($_SERVER['HTTP_HOST'])) {
    header('Content-Type: application/json; charset=utf-8');
}

/**
 * Función para enviar email usando Gmail SMTP
 */
function sendTestEmail($gmailUser, $gmailPassword, $recipient, $clinicName) {
    // Validar configuración
    if (empty($gmailUser) || empty($gmailPassword) || empty($recipient)) {
        return [
            'success' => false,
            'error' => 'Configuración incompleta. Revisa las variables en la parte superior del archivo.'
        ];
    }
    
    if (strpos($gmailUser, '@gmail.com') === false) {
        return [
            'success' => false,
            'error' => 'El usuario debe ser una cuenta de Gmail válida (@gmail.com)'
        ];
    }
    
    // Generar contenido del email de prueba
    $subject = "✅ Prueba de Email - $clinicName";
    $htmlContent = generateTestEmailHTML($clinicName);
    $textContent = generateTestEmailText($clinicName);
    
    // Preparar datos para envío
    $emailData = [
        'to' => $recipient,
        'subject' => $subject,
        'html' => $htmlContent,
        'text' => $textContent,
        'smtp_user' => $gmailUser,
        'smtp_password' => $gmailPassword,
        'from_email' => $gmailUser,
        'from_name' => $clinicName,
        'type' => 'test'
    ];
    
    // Intentar envío usando diferentes métodos
    $methods = [
        'curl_smtp' => 'Envío via cURL SMTP',
        'socket_smtp' => 'Envío via Socket SMTP',
        'native_mail' => 'Envío via mail() nativo'
    ];
    
    $results = [];
    
    foreach ($methods as $method => $description) {
        try {
            $result = null;
            
            switch ($method) {
                case 'curl_smtp':
                    $result = sendViaCurlSMTP($emailData);
                    break;
                case 'socket_smtp':
                    $result = sendViaSocketSMTP($emailData);
                    break;
                case 'native_mail':
                    $result = sendViaNativeMail($emailData);
                    break;
            }
            
            $results[$method] = [
                'description' => $description,
                'success' => $result['success'],
                'message' => $result['success'] ? 'Enviado exitosamente' : $result['error'],
                'details' => $result
            ];
            
            // Si uno funciona, usar ese como resultado principal
            if ($result['success']) {
                return [
                    'success' => true,
                    'method' => $description,
                    'messageId' => $result['messageId'] ?? uniqid(),
                    'allResults' => $results
                ];
            }
            
        } catch (Exception $e) {
            $results[$method] = [
                'description' => $description,
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'details' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    return [
        'success' => false,
        'error' => 'Ningún método de envío funcionó',
        'allResults' => $results
    ];
}

/**
 * Envío via cURL SMTP (Método preferido)
 */
function sendViaCurlSMTP($data) {
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'cURL no está disponible'];
    }
    
    $messageId = uniqid() . '@clinicadelux.com';
    $boundary = uniqid('boundary_');
    
    // Construir mensaje SMTP
    $message = buildSMTPMessage($data, $boundary, $messageId);
    
    // Crear archivo temporal para el mensaje
    $tempFile = tmpfile();
    fwrite($tempFile, $message);
    rewind($tempFile);
    
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => 'smtps://smtp.gmail.com:465',
        CURLOPT_USE_SSL => CURLUSESSL_ALL,
        CURLOPT_USERNAME => $data['smtp_user'],
        CURLOPT_PASSWORD => $data['smtp_password'],
        CURLOPT_MAIL_FROM => $data['from_email'],
        CURLOPT_MAIL_RCPT => [$data['to']],
        CURLOPT_READFILE => $tempFile,
        CURLOPT_UPLOAD => true,
        CURLOPT_VERBOSE => false,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    fclose($tempFile);
    
    if ($result === false || !empty($error)) {
        return [
            'success' => false,
            'error' => 'Error cURL: ' . ($error ?: 'Error desconocido'),
            'httpCode' => $httpCode
        ];
    }
    
    return [
        'success' => true,
        'messageId' => $messageId,
        'response' => $result,
        'httpCode' => $httpCode
    ];
}

/**
 * Envío via Socket SMTP
 */
function sendViaSocketSMTP($data) {
    $host = 'ssl://smtp.gmail.com';
    $port = 465;
    $timeout = 30;
    
    // Conectar al servidor SMTP
    $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);
    
    if (!$socket) {
        return [
            'success' => false,
            'error' => "No se pudo conectar a Gmail SMTP: $errstr ($errno)"
        ];
    }
    
    // Leer respuesta inicial
    $response = fgets($socket, 512);
    if (substr($response, 0, 3) !== '220') {
        fclose($socket);
        return ['success' => false, 'error' => 'Respuesta SMTP inválida: ' . $response];
    }
    
    // Comandos SMTP
    $commands = [
        "EHLO clinicadelux.com\r\n",
        "AUTH LOGIN\r\n",
        base64_encode($data['smtp_user']) . "\r\n",
        base64_encode($data['smtp_password']) . "\r\n",
        "MAIL FROM: <{$data['from_email']}>\r\n",
        "RCPT TO: <{$data['to']}>\r\n",
        "DATA\r\n"
    ];
    
    foreach ($commands as $command) {
        fputs($socket, $command);
        $response = fgets($socket, 512);
        
        // Verificar respuestas esperadas
        if (strpos($command, 'EHLO') !== false && substr($response, 0, 3) !== '250') {
            fclose($socket);
            return ['success' => false, 'error' => 'Error EHLO: ' . $response];
        }
        if (strpos($command, 'AUTH LOGIN') !== false && substr($response, 0, 3) !== '334') {
            fclose($socket);
            return ['success' => false, 'error' => 'Error AUTH: ' . $response];
        }
        if (strpos($command, 'MAIL FROM') !== false && substr($response, 0, 3) !== '250') {
            fclose($socket);
            return ['success' => false, 'error' => 'Error MAIL FROM: ' . $response];
        }
        if (strpos($command, 'RCPT TO') !== false && substr($response, 0, 3) !== '250') {
            fclose($socket);
            return ['success' => false, 'error' => 'Error RCPT TO: ' . $response];
        }
        if (strpos($command, 'DATA') !== false && substr($response, 0, 3) !== '354') {
            fclose($socket);
            return ['success' => false, 'error' => 'Error DATA: ' . $response];
        }
    }
    
    // Enviar contenido del mensaje
    $messageId = uniqid() . '@clinicadelux.com';
    $boundary = uniqid('boundary_');
    $message = buildSMTPMessage($data, $boundary, $messageId);
    
    fputs($socket, $message);
    fputs($socket, "\r\n.\r\n");
    
    $response = fgets($socket, 512);
    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => 'Error enviando mensaje: ' . $response];
    }
    
    // Cerrar conexión
    fputs($socket, "QUIT\r\n");
    fclose($socket);
    
    return [
        'success' => true,
        'messageId' => $messageId,
        'response' => $response
    ];
}

/**
 * Envío via mail() nativo de PHP
 */
function sendViaNativeMail($data) {
    // Configurar headers
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $data['from_name'] . ' <' . $data['from_email'] . '>',
        'Reply-To: ' . $data['from_email'],
        'X-Mailer: PHP/' . phpversion(),
        'X-Priority: 3'
    ];
    
    // Configurar parámetros de envío
    $additionalParams = '-f' . $data['from_email'];
    
    $success = mail(
        $data['to'],
        $data['subject'],
        $data['html'],
        implode("\r\n", $headers),
        $additionalParams
    );
    
    if ($success) {
        return [
            'success' => true,
            'messageId' => uniqid('mail_'),
            'note' => 'Enviado con mail() nativo - puede requerir configuración adicional del servidor'
        ];
    } else {
        return [
            'success' => false,
            'error' => 'Error con mail() nativo - revisa la configuración SMTP del servidor'
        ];
    }
}

/**
 * Construir mensaje SMTP completo
 */
function buildSMTPMessage($data, $boundary, $messageId) {
    $date = date('r');
    
    $message = "Message-ID: <$messageId>\r\n";
    $message .= "Date: $date\r\n";
    $message .= "From: {$data['from_name']} <{$data['from_email']}>\r\n";
    $message .= "To: {$data['to']}\r\n";
    $message .= "Subject: {$data['subject']}\r\n";
    $message .= "MIME-Version: 1.0\r\n";
    $message .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
    $message .= "X-Mailer: Clínica Delux Test System\r\n";
    $message .= "X-Priority: 3\r\n\r\n";
    
    // Parte de texto plano
    $message .= "--$boundary\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $data['text'] . "\r\n\r\n";
    
    // Parte HTML
    $message .= "--$boundary\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $data['html'] . "\r\n\r\n";
    
    $message .= "--$boundary--\r\n";
    
    return $message;
}

/**
 * Generar contenido HTML del email de prueba
 */
function generateTestEmailHTML($clinicName) {
    $mexicoTime = date('l, j \d\e F \d\e Y \a \l\a\s H:i T');
    
    return "
    <!DOCTYPE html>
    <html lang='es'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Prueba de Email - $clinicName</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d946ef, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-box { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
            .emoji { font-size: 24px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <div class='emoji'>✅</div>
                <h1>$clinicName</h1>
                <h2>Prueba de Email Exitosa</h2>
            </div>
            <div class='content'>
                <div class='success-box'>
                    <h3 style='margin-top: 0; color: #10b981;'>🎉 ¡Configuración de Email Funcionando!</h3>
                    <p>Si estás leyendo este mensaje, significa que el sistema de envío de correos de <strong>$clinicName</strong> está configurado correctamente y funcionando.</p>
                </div>
                
                <div class='info-box'>
                    <h4 style='margin-top: 0; color: #3b82f6;'>📋 Detalles de la Prueba</h4>
                    <p><strong>🕐 Fecha y Hora:</strong> $mexicoTime</p>
                    <p><strong>🌎 Zona Horaria:</strong> Ciudad de México (GMT-6)</p>
                    <p><strong>🏥 Sistema:</strong> Clínica Delux - Sistema de Gestión Médica</p>
                    <p><strong>📧 Método:</strong> Gmail SMTP (smtp.gmail.com:465)</p>
                </div>
                
                <h3>✨ Funcionalidades de Email Disponibles:</h3>
                <ul>
                    <li>📅 Confirmaciones de citas automáticas</li>
                    <li>⏰ Recordatorios de citas 24h antes</li>
                    <li>❌ Notificaciones de cancelación</li>
                    <li>👋 Mensajes de bienvenida para nuevos pacientes</li>
                    <li>👨‍⚕️ Notificaciones para profesionales</li>
                    <li>📊 Resúmenes diarios de agenda</li>
                </ul>
                
                <div class='info-box'>
                    <h4 style='margin-top: 0; color: #3b82f6;'>🔧 Próximos Pasos</h4>
                    <p>1. Configura las credenciales SMTP en el sistema</p>
                    <p>2. Activa las notificaciones automáticas</p>
                    <p>3. Personaliza los templates de email</p>
                    <p>4. Prueba el envío desde la aplicación</p>
                </div>
                
                <p><strong>¡El sistema está listo para enviar notificaciones a pacientes y profesionales!</strong></p>
            </div>
            <div class='footer'>
                <p><strong>$clinicName</strong></p>
                <p>🇲🇽 Ciudad de México, México</p>
                <p>Sistema de Gestión Médica</p>
                <p style='font-size: 12px; color: #9ca3af;'>Este es un email de prueba generado automáticamente.</p>
            </div>
        </div>
    </body>
    </html>";
}

/**
 * Generar contenido de texto plano del email de prueba
 */
function generateTestEmailText($clinicName) {
    $mexicoTime = date('l, j \d\e F \d\e Y \a \l\a\s H:i T');
    
    return "
✅ PRUEBA DE EMAIL EXITOSA - $clinicName

🎉 ¡Configuración de Email Funcionando!

Si estás leyendo este mensaje, significa que el sistema de envío de correos de $clinicName está configurado correctamente y funcionando.

📋 Detalles de la Prueba:
🕐 Fecha y Hora: $mexicoTime
🌎 Zona Horaria: Ciudad de México (GMT-6)
🏥 Sistema: Clínica Delux - Sistema de Gestión Médica
📧 Método: Gmail SMTP (smtp.gmail.com:465)

✨ Funcionalidades de Email Disponibles:
- 📅 Confirmaciones de citas automáticas
- ⏰ Recordatorios de citas 24h antes
- ❌ Notificaciones de cancelación
- 👋 Mensajes de bienvenida para nuevos pacientes
- 👨‍⚕️ Notificaciones para profesionales
- 📊 Resúmenes diarios de agenda

🔧 Próximos Pasos:
1. Configura las credenciales SMTP en el sistema
2. Activa las notificaciones automáticas
3. Personaliza los templates de email
4. Prueba el envío desde la aplicación

¡El sistema está listo para enviar notificaciones a pacientes y profesionales!

$clinicName
🇲🇽 Ciudad de México, México
Sistema de Gestión Médica

Este es un email de prueba generado automáticamente.
";
}

// =====================================================
// EJECUTAR PRUEBA
// =====================================================

echo "🚀 Iniciando prueba de envío de email...\n\n";

$result = sendTestEmail($GMAIL_USER, $GMAIL_PASSWORD, $TEST_RECIPIENT, $CLINIC_NAME);

// Mostrar resultado
if (isset($_SERVER['HTTP_HOST'])) {
    // Respuesta para navegador (JSON)
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    // Respuesta para línea de comandos
    if ($result['success']) {
        echo "✅ EMAIL ENVIADO EXITOSAMENTE!\n";
        echo "📧 Destinatario: $TEST_RECIPIENT\n";
        echo "🔧 Método usado: {$result['method']}\n";
        echo "🆔 Message ID: {$result['messageId']}\n\n";
        echo "🎉 ¡El sistema de email está funcionando correctamente!\n";
    } else {
        echo "❌ ERROR AL ENVIAR EMAIL\n";
        echo "💬 Error: {$result['error']}\n\n";
        
        if (isset($result['allResults'])) {
            echo "📊 Resultados de todos los métodos probados:\n";
            foreach ($result['allResults'] as $method => $methodResult) {
                $status = $methodResult['success'] ? '✅' : '❌';
                echo "  $status {$methodResult['description']}: {$methodResult['message']}\n";
            }
        }
        
        echo "\n💡 SOLUCIONES POSIBLES:\n";
        echo "1. Verifica que el email de Gmail sea correcto\n";
        echo "2. Usa una 'Contraseña de aplicación' en lugar de tu contraseña normal\n";
        echo "3. Habilita 'Verificación en 2 pasos' en tu cuenta de Gmail\n";
        echo "4. Verifica que el servidor tenga acceso a internet\n";
        echo "5. Revisa que cURL esté instalado y habilitado\n";
    }
}
?>