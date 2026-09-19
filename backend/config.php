<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use MongoDB\Client;
use MongoDB\Database;

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const MONGODB_DATABASE = 'fitness_gym';

function database(): Database
{
    static $database;
    if ($database instanceof Database) {
        return $database;
    }
    $uri = getenv('MONGODB_URI') ?: MONGODB_URI;
    $name = getenv('MONGODB_DATABASE') ?: MONGODB_DATABASE;
    $database = (new Client($uri))->selectDatabase($name);
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

function requireAdmin(): void
{
    if (empty($_SESSION['admin_id'])) {
        jsonResponse(['success' => false, 'message' => 'Admin login required.'], 401);
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
