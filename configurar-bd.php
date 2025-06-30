<?php
/**
 * =====================================================
 * CONFIGURADOR RÁPIDO DE BASE DE DATOS
 * Clínica Delux - Sistema de Gestión Médica
 * =====================================================
 * 
 * Ejecuta este archivo para configurar las credenciales
 * de la base de datos automáticamente.
 * 
 * Uso: php configurar-bd.php
 * O accede desde el navegador: http://tu-servidor/Clinica-delux/configurar-bd.php
 */

// Configurar zona horaria
date_default_timezone_set('America/Mexico_City');

// Variables de configuración
$host = '';
$username = '';
$password = '';
$database = '';
$configUpdated = false;
$errors = [];
$success = [];

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = $_POST['host'] ?? 'localhost';
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $database = $_POST['database'] ?? 'clinica_delux';
    
    if (empty($username)) {
        $errors[] = 'El usuario de MySQL es requerido';
    } else {
        try {
            // Probar conexión a MySQL
            $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            
            $success[] = "✅ Conexión a MySQL exitosa";
            
            // Configurar zona horaria
            $pdo->exec("SET time_zone = '-06:00'");
            
            // Verificar que las tablas existan
            $tables = ['users', 'patients', 'professionals', 'appointments', 'disciplines'];
            $existingTables = [];
            
            foreach ($tables as $table) {
                $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
                $stmt->execute([$table]);
                if ($stmt->fetch()) {
                    $existingTables[] = $table;
                }
            }
            
            $success[] = "✅ Tablas encontradas: " . implode(', ', $existingTables);
            
            // Actualizar archivo .env
            $envContent = "DB_HOST=$host\nDB_USER=$username\nDB_PASSWORD=$password\nDB_NAME=$database\n";
            
            if (file_put_contents('.env', $envContent)) {
                $success[] = "✅ Archivo .env creado exitosamente";
                $configUpdated = true;
            } else {
                $errors[] = "❌ No se pudo escribir el archivo .env";
            }
            
        } catch (PDOException $e) {
            $errors[] = "❌ Error de conexión: " . $e->getMessage();
        } catch (Exception $e) {
            $errors[] = "❌ Error: " . $e->getMessage();
        }
    }
}

// Detectar credenciales comunes automáticamente
$commonCredentials = [
    ['root', ''],
    ['root', 'root'],
    ['root', 'password'],
    ['clinica_user', 'password'],
    ['mysql', ''],
    ['admin', 'admin']
];

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurar Base de Datos - Clínica Delux</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #d946ef, #a855f7);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #d946ef, #a855f7);
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        h1 { color: #1f2937; margin-bottom: 10px; }
        .subtitle { color: #6b7280; margin-bottom: 20px; }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #374151;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #d946ef;
        }
        .btn {
            background: linear-gradient(135deg, #d946ef, #a855f7);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .alert {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .alert-success {
            background: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
        }
        .alert-error {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }
        .success-icon { color: #10b981; font-size: 48px; margin-bottom: 20px; }
        .common-creds {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .common-creds h4 { margin-bottom: 10px; color: #1f2937; }
        .cred-button {
            background: #e5e7eb;
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            margin: 5px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            display: inline-block;
        }
        .cred-button:hover { background: #d1d5db; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏥</div>
            <h1>Clínica Delux</h1>
            <p class="subtitle">Configuración de Base de Datos</p>
        </div>

        <?php if ($configUpdated): ?>
            <div style="text-align: center;">
                <div class="success-icon">✅</div>
                <h2 style="color: #10b981; margin-bottom: 20px;">¡Configuración Completada!</h2>
                
                <?php foreach ($success as $msg): ?>
                    <div class="alert alert-success"><?php echo htmlspecialchars($msg); ?></div>
                <?php endforeach; ?>
                
                <div style="margin-top: 30px;">
                    <a href="index.html" class="btn" style="text-decoration: none; display: inline-block;">
                        🚀 Ir al Sistema
                    </a>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 10px; font-size: 14px; color: #92400e;">
                    <strong>⚠️ IMPORTANTE:</strong> Puedes eliminar este archivo (configurar-bd.php) por seguridad.
                </div>
            </div>
        <?php else: ?>
            <?php if (!empty($errors)): ?>
                <?php foreach ($errors as $error): ?>
                    <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
                <?php endforeach; ?>
            <?php endif; ?>

            <div class="common-creds">
                <h4>🔧 Credenciales Comunes</h4>
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">Haz clic para probar credenciales comunes:</p>
                <?php foreach ($commonCredentials as $cred): ?>
                    <span class="cred-button" onclick="fillCredentials('<?php echo $cred[0]; ?>', '<?php echo $cred[1]; ?>')">
                        <?php echo $cred[0]; ?> / <?php echo $cred[1] ?: '(sin contraseña)'; ?>
                    </span>
                <?php endforeach; ?>
            </div>

            <form method="POST">
                <div class="form-group">
                    <label for="host">Servidor MySQL:</label>
                    <input type="text" id="host" name="host" value="<?php echo htmlspecialchars($host ?: 'localhost'); ?>" required>
                </div>

                <div class="form-group">
                    <label for="username">Usuario MySQL:</label>
                    <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($username); ?>" required>
                </div>

                <div class="form-group">
                    <label for="password">Contraseña MySQL:</label>
                    <input type="password" id="password" name="password" value="<?php echo htmlspecialchars($password); ?>">
                </div>

                <div class="form-group">
                    <label for="database">Nombre de la Base de Datos:</label>
                    <input type="text" id="database" name="database" value="<?php echo htmlspecialchars($database ?: 'clinica_delux'); ?>" required>
                </div>

                <button type="submit" class="btn">🔧 Configurar Conexión</button>
            </form>

            <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 10px; font-size: 14px; color: #1e40af;">
                <strong>💡 Ayuda:</strong> Si no conoces las credenciales, consulta con tu administrador de sistemas o revisa la configuración de MySQL en tu servidor.
            </div>
        <?php endif; ?>
    </div>

    <script>
        function fillCredentials(user, pass) {
            document.getElementById('username').value = user;
            document.getElementById('password').value = pass;
        }
    </script>
</body>
</html>