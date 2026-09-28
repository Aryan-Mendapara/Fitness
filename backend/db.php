<?php
declare(strict_types=1);

use MongoDB\Client;
use MongoDB\Collection;
use MongoDB\Database;

require_once __DIR__ . '/vendor/autoload.php';

function database(): Database
{
    static $database;
    if ($database instanceof Database) {
        return $database;
    }
    $client = new Client(environment('MONGODB_URI', 'mongodb://127.0.0.1:27017'));
    $database = $client->selectDatabase(environment('MONGODB_DATABASE', 'fitness'));
    ensureSchema($database);
    return $database;
}

function collection(string $name): Collection
{
    return database()->selectCollection($name);
}

function ensureSchema(Database $database): void
{
    collection('membership_applications')->createIndex(['user_id' => 1], ['unique' => true, 'sparse' => true]);
    collection('membership_applications')->createIndex(['email' => 1], ['unique' => true, 'sparse' => true]);

    if (collection('admins')->countDocuments(['email' => environment('ADMIN_EMAIL', 'admin@fitness.com')]) === 0) {
        collection('admins')->insertOne([
            'name' => environment('ADMIN_NAME', 'Fitness Admin'),
            'email' => environment('ADMIN_EMAIL', 'admin@fitness.com'),
            'password_hash' => password_hash(environment('ADMIN_PASSWORD', 'admin123'), PASSWORD_DEFAULT),
            'created_at' => date('c'),
        ]);
    }
    if (collection('plans')->countDocuments() === 0) {
        collection('plans')->insertMany([
            ['name' => 'Basic', 'price' => '999', 'duration' => '1 Month', 'description' => 'Gym access and locker.', 'created_at' => date('c')],
            ['name' => 'Standard', 'price' => '2499', 'duration' => '3 Months', 'description' => 'Gym access and group classes.', 'created_at' => date('c')],
            ['name' => 'Premium', 'price' => '7999', 'duration' => '12 Months', 'description' => 'All access with personal training.', 'created_at' => date('c')],
        ]);
    }
    if (collection('services')->countDocuments() === 0) {
        collection('services')->insertMany([
            ['name' => 'Modern Equipment', 'description' => 'Use modern, well-maintained equipment for safe, effective workouts.', 'status' => 'Active', 'created_at' => date('c')],
            ['name' => 'Expert Trainers', 'description' => 'Get guidance from certified trainers who keep every session focused on your goals.', 'status' => 'Active', 'created_at' => date('c')],
            ['name' => 'Flexible Hours', 'description' => 'Choose a training time that fits your schedule and keeps your routine consistent.', 'status' => 'Active', 'created_at' => date('c')],
        ]);
    }
    if (collection('facilities')->countDocuments() === 0) {
        collection('facilities')->insertMany([
            ['name' => 'Weight Loss Training', 'image' => 'assets/WEIGHT LOSS photo.jpg', 'description' => 'Effective fat-burning plans to help you lose weight and improve overall fitness.', 'created_at' => date('c')],
            ['name' => 'Personal Locker', 'image' => 'assets/personal locker photo.jpeg', 'description' => 'Safe and private locker facilities to keep your belongings secure.', 'created_at' => date('c')],
            ['name' => 'Steam Bath & Shower', 'image' => 'assets/steam bath & shower photo.png', 'description' => 'A relaxing wellness area to refresh your body and recover.', 'created_at' => date('c')],
        ]);
    }
}

function normalizeDocument(array|object $document): array
{
    $row = is_object($document) ? json_decode(json_encode($document), true) : $document;
    $id = is_array($document) ? ($document['_id'] ?? null) : ($document->_id ?? null);
    $row['id'] = (string) $id;
    unset($row['_id'], $row['password_hash']);
    if (isset($row['read'])) {
        $row['read'] = (bool) $row['read'];
    }
    return $row;
}

function idFilter(string $id): array
{
    if (!preg_match('/^[a-f0-9]{24}$/i', $id)) {
        return ['_id' => $id];
    }
    $objectIdClass = 'MongoDB\\BSON\\ObjectId';
    return ['_id' => new $objectIdClass($id)];
}

function findOne(string $name, array $filter): ?array
{
    $document = collection($name)->findOne($filter);
    return $document ? normalizeDocument($document) : null;
}

function findAll(string $name): array
{
    return array_map('normalizeDocument', collection($name)->find([], ['sort' => ['created_at' => -1]])->toArray());
}

function recordId(mixed $id): string
{
    $value = trim((string) $id);
    if ($value === '') {
        jsonResponse(['success' => false, 'message' => 'Invalid record id.'], 422);
    }
    return $value;
}
