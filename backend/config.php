<?php
declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_NAME = 'fitness_gym';
const DB_USER = 'root';
const DB_PASSWORD = '';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://127.0.0.1:5500', 'http://localhost:5500'], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function database(): PDO
{
    static $database;
    if ($database instanceof PDO) return $database;

    $host = getenv('DB_HOST') ?: DB_HOST;
    $name = getenv('DB_NAME') ?: DB_NAME;
    $user = getenv('DB_USER') ?: DB_USER;
    $password = getenv('DB_PASSWORD') ?: DB_PASSWORD;
    $database = new PDO("mysql:host={$host};dbname={$name};charset=utf8mb4", $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $database;
}

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    return is_array($body) ? $body : $_POST;
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
