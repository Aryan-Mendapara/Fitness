<?php
declare(strict_types=1);

session_start();
require __DIR__ . '/config.php';

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

$method = $_SERVER['REQUEST_METHOD'];
$body = requestBody();
$action = cleanString($_GET['action'] ?? $body['action'] ?? '');

function idValue(mixed $id): ObjectId
{
    try {
        return new ObjectId((string) $id);
    } catch (Throwable) {
        jsonResponse(['success' => false, 'message' => 'Invalid record id.'], 422);
    }
}

function normaliseDocument(array $document): array
{
    if (isset($document['_id'])) {
        $document['id'] = (string) $document['_id'];
        unset($document['_id']);
    }
    foreach ($document as $key => $value) {
        if ($value instanceof UTCDateTime) {
            $document[$key] = $value->toDateTime()->format('Y-m-d');
        }
    }
    return $document;
}

function documents(string $collection, array $filter = [], array $options = []): array
{
    return array_map('normaliseDocument', database()->selectCollection($collection)->find($filter, $options)->toArray());
}

try {
    $db = database();

    if ($method === 'POST' && $action === 'register') {
        validateRequired($body, ['email', 'password']);
        $email = strtolower(cleanString($body['email'], 190));
        $password = (string) ($body['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
            jsonResponse(['success' => false, 'message' => 'Use a valid email and a password of at least 6 characters.'], 422);
        }
        if ($db->users->countDocuments(['email' => $email]) > 0) {
            jsonResponse(['success' => false, 'message' => 'This email is already registered.'], 409);
        }
        $result = $db->users->insertOne(['name' => 'FITNESS Member', 'email' => $email, 'password_hash' => password_hash($password, PASSWORD_DEFAULT), 'created_at' => new UTCDateTime()]);
        jsonResponse(['success' => true, 'message' => 'Registration successful.', 'id' => (string) $result->getInsertedId()]);
    }

    if ($method === 'POST' && $action === 'login') {
        validateRequired($body, ['email', 'password']);
        $user = $db->users->findOne(['email' => strtolower(cleanString($body['email'], 190))]);
        if (!$user || !password_verify((string) $body['password'], (string) $user['password_hash'])) {
            jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
        }
        $_SESSION['user_id'] = (string) $user['_id'];
        jsonResponse(['success' => true, 'user' => ['id' => (string) $user['_id'], 'email' => $user['email']]]);
    }

    if ($method === 'POST' && $action === 'admin_login') {
        validateRequired($body, ['email', 'password']);
        $admin = $db->admins->findOne(['email' => strtolower(cleanString($body['email'], 190))]);
        if (!$admin || !password_verify((string) $body['password'], (string) $admin['password_hash'])) {
            jsonResponse(['success' => false, 'message' => 'Invalid admin email or password.'], 401);
        }
        $_SESSION['admin_id'] = (string) $admin['_id'];
        $_SESSION['user_id'] = null;
        jsonResponse(['success' => true, 'admin' => ['id' => (string) $admin['_id'], 'name' => $admin['name'], 'email' => $admin['email']]]);
    }

    if ($method === 'POST' && $action === 'logout') {
        $_SESSION = [];
        session_destroy();
        jsonResponse(['success' => true]);
    }

    if ($method === 'GET' && $action === 'session') {
        jsonResponse(['success' => true, 'loggedIn' => !empty($_SESSION['user_id']), 'adminLoggedIn' => !empty($_SESSION['admin_id'])]);
    }

    if ($method === 'POST' && $action === 'join') {
        validateRequired($body, ['name', 'age', 'gender', 'phone', 'plan']);
        $db->membership_applications->insertOne([
            'user_id' => !empty($_SESSION['user_id']) ? idValue($_SESSION['user_id']) : null,
            'name' => cleanString($body['name'], 120), 'age' => max(10, min(100, (int) $body['age'])),
            'gender' => cleanString($body['gender'], 20), 'phone' => cleanString($body['phone'], 30),
            'email' => cleanString($body['email'] ?? '', 190) ?: null, 'plan' => cleanString($body['plan'], 60),
            'address' => cleanString($body['address'] ?? '', 1000) ?: null,
            'emergencyName' => cleanString($body['emergencyName'] ?? '', 120) ?: null,
            'emergencyPhone' => cleanString($body['emergencyPhone'] ?? '', 30) ?: null,
            'status' => 'Pending', 'created_at' => new UTCDateTime(),
        ]);
        jsonResponse(['success' => true, 'message' => 'Membership application submitted successfully.']);
    }

    requireAdmin();
    if ($method === 'GET' && $action === 'admin_dashboard') {
        $counts = [];
        foreach (['users', 'trainers', 'plans', 'payments'] as $collection) $counts[$collection] = $db->{$collection}->countDocuments();
        $counts['active'] = $db->membership_applications->countDocuments(['status' => 'Approved']);
        $counts['expired'] = $db->membership_applications->countDocuments(['status' => 'Rejected']);
        $counts['newEnquiries'] = $db->enquiries->countDocuments(['read' => false]);
        $recent = documents('users', [], ['sort' => ['created_at' => -1], 'limit' => 4]);
        jsonResponse(['success' => true, 'stats' => $counts, 'recent' => $recent]);
    }

    $entities = ['members' => 'users', 'plans' => 'plans', 'trainers' => 'trainers', 'services' => 'services', 'facilities' => 'facilities', 'payments' => 'payments', 'enquiries' => 'enquiries'];
    $fields = [
        'members' => ['name', 'email', 'phone', 'plan', 'status', 'joined'],
        'plans' => ['name', 'price', 'duration', 'description'],
        'trainers' => ['name', 'photo', 'specialization', 'experience', 'contact'],
        'services' => ['name', 'description', 'status'],
        'facilities' => ['name', 'image', 'description'],
        'payments' => ['member', 'plan', 'amount', 'status', 'date'],
    ];

    if ($method === 'GET' && isset($entities[$action])) {
        $records = documents($entities[$action], [], ['sort' => ['created_at' => -1]]);
        jsonResponse(['success' => true, 'data' => $records]);
    }

    if ($method === 'POST' && $action === 'save') {
        $entityName = cleanString($body['entity'] ?? '');
        if (!isset($entities[$entityName]) || $entityName === 'enquiries') jsonResponse(['success' => false, 'message' => 'Invalid entity.'], 422);
        $data = is_array($body['data'] ?? null) ? $body['data'] : [];
        validateRequired($data, $fields[$entityName]);
        $record = array_fill_keys($fields[$entityName], '');
        foreach ($record as $field => $_) $record[$field] = cleanString($data[$field] ?? '', 2000);
        if ($entityName === 'payments' && isset($record['amount'])) $record['amount'] = (float) $record['amount'];
        $record['updated_at'] = new UTCDateTime();
        $collection = $db->{$entities[$entityName]};
        if (!empty($body['id'])) $collection->updateOne(['_id' => idValue($body['id'])], ['$set' => $record]);
        else { $record['created_at'] = new UTCDateTime(); $collection->insertOne($record); }
        jsonResponse(['success' => true, 'message' => 'Record saved successfully.']);
    }

    if ($method === 'DELETE' && $action === 'delete') {
        $entityName = cleanString($_GET['entity'] ?? '');
        if (!isset($entities[$entityName]) || $entityName === 'enquiries') jsonResponse(['success' => false, 'message' => 'Invalid delete request.'], 422);
        $db->{$entities[$entityName]}->deleteOne(['_id' => idValue($_GET['id'] ?? '')]);
        jsonResponse(['success' => true, 'message' => 'Record deleted successfully.']);
    }

    if ($method === 'POST' && $action === 'toggle_enquiry') {
        $enquiry = $db->enquiries->findOne(['_id' => idValue($body['id'] ?? '')]);
        if ($enquiry) $db->enquiries->updateOne(['_id' => $enquiry['_id']], ['$set' => ['read' => !((bool) ($enquiry['read'] ?? false))]]);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['success' => false, 'message' => 'Unknown API action.'], 404);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    jsonResponse(['success' => false, 'message' => 'Server error. Check the PHP error log.'], 500);
}
