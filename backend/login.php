<?php
declare(strict_types=1);

session_start();
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Only POST requests are allowed.'], 405);
}

$body = requestBody();
$role = cleanString($body['role'] ?? 'user');
$email = strtolower(cleanString($body['email'] ?? '', 190));
$password = (string) ($body['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    jsonResponse(['success' => false, 'message' => 'Enter a valid email and password.'], 422);
}

if (!in_array($role, ['user', 'admin'], true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid login role.'], 422);
}

$collection = $role === 'admin' ? 'admins' : 'users';
$account = database()->{$collection}->findOne(['email' => $email]);

if (!$account || !password_verify($password, (string) $account['password_hash'])) {
    jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
}

if ($role === 'admin') {
    $_SESSION['admin_id'] = (string) $account['_id'];
    unset($_SESSION['user_id']);
    jsonResponse([
        'success' => true,
        'message' => 'Admin login successful.',
        'admin' => [
            'id' => (string) $account['_id'],
            'name' => $account['name'] ?? 'Administrator',
            'email' => $account['email'],
        ],
    ]);
}

$_SESSION['user_id'] = (string) $account['_id'];
unset($_SESSION['admin_id']);
jsonResponse([
    'success' => true,
    'message' => 'Login successful.',
    'user' => [
        'id' => (string) $account['_id'],
        'email' => $account['email'],
    ],
]);