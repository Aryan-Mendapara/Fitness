<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

loadEnvironment(__DIR__ . '/.env');

function loadEnvironment(string $file): void
{
    if (!is_readable($file)) {
        return;
    }

    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if ($value !== '' && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }
        if ($name !== '' && getenv($name) === false) {
            putenv($name . '=' . $value);
        }
    }
}

function environment(string $name, string $default = ''): string
{
    $value = getenv($name);
    return $value === false ? $default : $value;
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('fitness_member_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);
    session_start();
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestBody(): array
{
    $raw = file_get_contents('php://input');
    $body = json_decode($raw ?: '', true);
    return is_array($body) ? $body : $_POST;
}

function requireAdmin(): void
{
    if (empty($_SESSION['admin_id'])) {
        jsonResponse(['success' => false, 'message' => 'Admin login required.'], 401);
    }
}

function requireMember(): void
{
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'message' => 'Member login required.'], 401);
    }
}

function cleanString(mixed $value, int $maxLength = 255): string
{
    return trim(substr((string) ($value ?? ''), 0, $maxLength));
}

function validateRequired(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (cleanString($data[$field] ?? '') === '') {
            jsonResponse(['success' => false, 'message' => ucfirst($field) . ' is required.'], 422);
        }
    }
}
