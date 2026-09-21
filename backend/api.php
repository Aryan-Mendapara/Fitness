<?php
declare(strict_types=1);

session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => false, 'httponly' => true, 'samesite' => 'Lax']);
session_start();
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$body = requestBody();
$action = cleanString($_GET['action'] ?? $body['action'] ?? '');
$db = database();

function fetchRows(PDO $db, string $table): array
{
    $allowed = ['users', 'plans', 'trainers', 'services', 'facilities', 'payments'];
    if (!in_array($table, $allowed, true)) return [];
    return $db->query("SELECT * FROM `{$table}` ORDER BY created_at DESC")->fetchAll();
}

function requireAdmin(): void
{
    if (empty($_SESSION['admin_id'])) jsonResponse(['success' => false, 'message' => 'Admin login required.'], 401);
}

try {
    if ($method === 'POST' && $action === 'register') {
        validateRequired($body, ['email', 'password']);
        $email = strtolower(cleanString($body['email'], 190));
        $password = (string) ($body['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) jsonResponse(['success' => false, 'message' => 'Use a valid email and a password of at least 6 characters.'], 422);
        $statement = $db->prepare('SELECT id FROM users WHERE email = ?');
        $statement->execute([$email]);
        if ($statement->fetch()) jsonResponse(['success' => false, 'message' => 'This email is already registered.'], 409);
        $statement = $db->prepare('INSERT INTO users (name, email, password_hash, joined) VALUES (?, ?, ?, CURDATE())');
        $statement->execute(['FITNESS Member', $email, password_hash($password, PASSWORD_DEFAULT)]);
        jsonResponse(['success' => true, 'message' => 'Registration successful.', 'id' => (string) $db->lastInsertId()]);
    }

    if ($method === 'POST' && in_array($action, ['login', 'admin_login'], true)) {
        validateRequired($body, ['email', 'password']);
        $table = $action === 'admin_login' ? 'admins' : 'users';
        $statement = $db->prepare("SELECT * FROM {$table} WHERE email = ?");
        $statement->execute([strtolower(cleanString($body['email'], 190))]);
        $account = $statement->fetch();
        if (!$account || !password_verify((string) $body['password'], (string) $account['password_hash'])) jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
        if ($action === 'admin_login') {
            $_SESSION['admin_id'] = $account['id'];
            jsonResponse(['success' => true, 'admin' => ['id' => $account['id'], 'name' => $account['name'], 'email' => $account['email']]]);
        }
        $_SESSION['user_id'] = $account['id'];
        jsonResponse(['success' => true, 'user' => ['id' => $account['id'], 'email' => $account['email']]]);
    }

    if ($method === 'POST' && $action === 'logout') {
        $_SESSION = [];
        session_destroy();
        jsonResponse(['success' => true]);
    }
    if ($method === 'GET' && $action === 'session') jsonResponse(['success' => true, 'loggedIn' => !empty($_SESSION['user_id']), 'adminLoggedIn' => !empty($_SESSION['admin_id'])]);

    if ($method === 'POST' && $action === 'join') {
        validateRequired($body, ['name', 'age', 'gender', 'phone', 'plan']);
        $statement = $db->prepare('INSERT INTO membership_applications (user_id, name, age, gender, phone, email, plan, address, emergencyName, emergencyPhone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $statement->execute([
            $_SESSION['user_id'] ?? null, cleanString($body['name'], 120), max(10, min(100, (int) $body['age'])), cleanString($body['gender'], 20), cleanString($body['phone'], 30), cleanString($body['email'] ?? '', 190) ?: null, cleanString($body['plan'], 60), cleanString($body['address'] ?? '', 1000) ?: null, cleanString($body['emergencyName'] ?? '', 120) ?: null, cleanString($body['emergencyPhone'] ?? '', 30) ?: null,
        ]);
        jsonResponse(['success' => true, 'message' => 'Membership application submitted successfully.']);
    }

    requireAdmin();
    if ($method === 'GET' && $action === 'admin_dashboard') {
        $counts = [];
        foreach (['users', 'trainers', 'plans', 'payments'] as $table) $counts[$table] = (int) $db->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
        $counts['active'] = (int) $db->query("SELECT COUNT(*) FROM membership_applications WHERE status = 'Approved'")->fetchColumn();
        $counts['expired'] = (int) $db->query("SELECT COUNT(*) FROM membership_applications WHERE status = 'Rejected'")->fetchColumn();
        $counts['newEnquiries'] = (int) $db->query('SELECT COUNT(*) FROM enquiries WHERE read_status = 0')->fetchColumn();
        $recent = $db->query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 4')->fetchAll();
        jsonResponse(['success' => true, 'stats' => $counts, 'recent' => $recent]);
    }

    $entities = ['members' => 'users', 'plans' => 'plans', 'trainers' => 'trainers', 'services' => 'services', 'facilities' => 'facilities', 'payments' => 'payments'];
    $fields = ['members' => ['name', 'email', 'phone', 'plan', 'status', 'joined'], 'plans' => ['name', 'price', 'duration', 'description'], 'trainers' => ['name', 'photo', 'specialization', 'experience', 'contact'], 'services' => ['name', 'description', 'status'], 'facilities' => ['name', 'image', 'description'], 'payments' => ['member', 'plan', 'amount', 'status', 'date']];
    if ($method === 'GET' && $action === 'enquiries') {
        $rows = $db->query('SELECT id, name, email, phone, message, read_status AS `read` FROM enquiries ORDER BY created_at DESC')->fetchAll();
        foreach ($rows as &$row) $row['read'] = (bool) $row['read'];
        jsonResponse(['success' => true, 'data' => $rows]);
    }
    if ($method === 'GET' && isset($entities[$action])) jsonResponse(['success' => true, 'data' => fetchRows($db, $entities[$action])]);

    if ($method === 'POST' && $action === 'save') {
        $entity = cleanString($body['entity'] ?? '');
        if (!isset($entities[$entity])) jsonResponse(['success' => false, 'message' => 'Invalid entity.'], 422);
        $data = is_array($body['data'] ?? null) ? $body['data'] : [];
        validateRequired($data, $fields[$entity]);
        $columns = $fields[$entity];
        $values = array_map(fn(string $field): string => cleanString($data[$field] ?? '', 2000), $columns);
        if (!empty($body['id'])) {
            $set = implode(', ', array_map(fn(string $field): string => "`{$field}` = ?", $columns));
            $statement = $db->prepare("UPDATE {$entities[$entity]} SET {$set} WHERE id = ?");
            $statement->execute([...$values, (int) $body['id']]);
        } else {
            $statement = $db->prepare("INSERT INTO {$entities[$entity]} (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', array_fill(0, count($columns), '?')) . ")");
            $statement->execute($values);
        }
        jsonResponse(['success' => true, 'message' => 'Record saved successfully.']);
    }
    if ($method === 'DELETE' && $action === 'delete') {
        $entity = cleanString($_GET['entity'] ?? '');
        if (!isset($entities[$entity])) jsonResponse(['success' => false, 'message' => 'Invalid delete request.'], 422);
        $statement = $db->prepare("DELETE FROM {$entities[$entity]} WHERE id = ?");
        $statement->execute([(int) ($_GET['id'] ?? 0)]);
        jsonResponse(['success' => true, 'message' => 'Record deleted successfully.']);
    }
    if ($method === 'POST' && $action === 'toggle_enquiry') {
        $statement = $db->prepare('UPDATE enquiries SET read_status = 1 - read_status WHERE id = ?');
        $statement->execute([(int) ($body['id'] ?? 0)]);
        jsonResponse(['success' => true]);
    }
    jsonResponse(['success' => false, 'message' => 'Unknown API action.'], 404);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    jsonResponse(['success' => false, 'message' => 'Server error. Check the PHP error log.'], 500);
}
