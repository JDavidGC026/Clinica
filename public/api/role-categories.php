<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$categoryId = $_GET['id'] ?? null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($categoryId) {
                // Obtener una categoría específica
                $stmt = $pdo->prepare("SELECT * FROM role_categories WHERE id = ?");
                $stmt->execute([$categoryId]);
                $category = $stmt->fetch();
                
                if (!$category) {
                    logApiActivity('role-categories', 'GET', 404, "Category not found: ID $categoryId");
                    sendError('Category not found', 404);
                }
                
                // Contar roles asociados
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM roles WHERE category_id = ?");
                $stmt->execute([$categoryId]);
                $category['roles_count'] = $stmt->fetch()['count'];
                
                logApiActivity('role-categories', 'GET', 200, "Retrieved category: ID $categoryId");
                sendResponse($category);
            } else {
                // Obtener todas las categorías
                $includeRoles = isset($_GET['include_roles']) && $_GET['include_roles'] === '1';
                
                $stmt = $pdo->query("SELECT * FROM role_categories ORDER BY name");
                $categories = $stmt->fetchAll();
                
                if ($includeRoles) {
                    foreach ($categories as &$category) {
                        $stmt = $pdo->prepare("SELECT * FROM roles WHERE category_id = ? ORDER BY name");
                        $stmt->execute([$category['id']]);
                        $category['roles'] = $stmt->fetchAll();
                    }
                } else {
                    // Solo agregar el conteo de roles
                    foreach ($categories as &$category) {
                        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM roles WHERE category_id = ?");
                        $stmt->execute([$category['id']]);
                        $category['roles_count'] = $stmt->fetch()['count'];
                    }
                }
                
                logApiActivity('role-categories', 'GET', 200, "Retrieved all categories: " . count($categories) . " records");
                sendResponse($categories);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            if (!isset($data['name'])) {
                logApiActivity('role-categories', 'POST', 400, "Missing required field: name");
                sendError('Missing required field: name', 400);
            }
            
            // Verificar si ya existe una categoría con ese nombre
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM role_categories WHERE name = ?");
            $stmt->execute([$data['name']]);
            if ($stmt->fetch()['count'] > 0) {
                logApiActivity('role-categories', 'POST', 400, "Category name already exists: " . $data['name']);
                sendError('Category name already exists', 400);
            }
            
            // Crear la categoría
            $description = $data['description'] ?? null;
            $color = $data['color'] ?? '#3b82f6'; // Azul por defecto
            
            $stmt = $pdo->prepare("INSERT INTO role_categories (name, description, color) VALUES (?, ?, ?)");
            $stmt->execute([$data['name'], $description, $color]);
            $newCategoryId = $pdo->lastInsertId();
            
            // Obtener la categoría creada
            $stmt = $pdo->prepare("SELECT * FROM role_categories WHERE id = ?");
            $stmt->execute([$newCategoryId]);
            $category = $stmt->fetch();
            $category['roles_count'] = 0; // Nueva categoría no tiene roles
            
            logApiActivity('role-categories', 'POST', 201, "Created category: " . $data['name']);
            sendResponse($category, 201);
            break;
            
        case 'PUT':
            if (!$categoryId) {
                logApiActivity('role-categories', 'PUT', 400, "Category ID required");
                sendError('Category ID required', 400);
            }
            
            $data = getRequestData();
            
            // Verificar que la categoría existe
            $stmt = $pdo->prepare("SELECT * FROM role_categories WHERE id = ?");
            $stmt->execute([$categoryId]);
            $existingCategory = $stmt->fetch();
            
            if (!$existingCategory) {
                logApiActivity('role-categories', 'PUT', 404, "Category not found: ID $categoryId");
                sendError('Category not found', 404);
            }
            
            // Verificar nombre único si se está cambiando
            if (isset($data['name']) && $data['name'] !== $existingCategory['name']) {
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM role_categories WHERE name = ? AND id != ?");
                $stmt->execute([$data['name'], $categoryId]);
                if ($stmt->fetch()['count'] > 0) {
                    logApiActivity('role-categories', 'PUT', 400, "Category name already exists: " . $data['name']);
                    sendError('Category name already exists', 400);
                }
            }
            
            // Actualizar campos
            $updateFields = [];
            $updateValues = [];
            
            if (isset($data['name'])) {
                $updateFields[] = 'name = ?';
                $updateValues[] = $data['name'];
            }
            
            if (isset($data['description'])) {
                $updateFields[] = 'description = ?';
                $updateValues[] = $data['description'];
            }
            
            if (isset($data['color'])) {
                $updateFields[] = 'color = ?';
                $updateValues[] = $data['color'];
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $categoryId;
                $sql = "UPDATE role_categories SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($updateValues);
            }
            
            // Obtener la categoría actualizada
            $stmt = $pdo->prepare("SELECT * FROM role_categories WHERE id = ?");
            $stmt->execute([$categoryId]);
            $category = $stmt->fetch();
            
            // Agregar conteo de roles
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM roles WHERE category_id = ?");
            $stmt->execute([$categoryId]);
            $category['roles_count'] = $stmt->fetch()['count'];
            
            logApiActivity('role-categories', 'PUT', 200, "Updated category: ID $categoryId");
            sendResponse($category);
            break;
            
        case 'DELETE':
            if (!$categoryId) {
                logApiActivity('role-categories', 'DELETE', 400, "Category ID required");
                sendError('Category ID required', 400);
            }
            
            // Verificar si la categoría tiene roles asociados
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM roles WHERE category_id = ?");
            $stmt->execute([$categoryId]);
            $rolesCount = $stmt->fetch()['count'];
            
            if ($rolesCount > 0) {
                logApiActivity('role-categories', 'DELETE', 400, "Cannot delete category: has $rolesCount roles");
                sendError("Cannot delete category: it has $rolesCount role(s) associated", 400);
            }
            
            // Eliminar la categoría
            $stmt = $pdo->prepare("DELETE FROM role_categories WHERE id = ?");
            $result = $stmt->execute([$categoryId]);
            
            if ($stmt->rowCount() > 0) {
                logApiActivity('role-categories', 'DELETE', 200, "Deleted category: ID $categoryId");
                sendResponse(['success' => true, 'message' => 'Category deleted successfully']);
            } else {
                logApiActivity('role-categories', 'DELETE', 404, "Category not found: ID $categoryId");
                sendError('Category not found', 404);
            }
            break;
            
        default:
            logApiActivity('role-categories', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('role-categories', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}
?>
