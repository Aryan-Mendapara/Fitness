<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = requestBody();
$action = cleanString($_GET['action'] ?? $body['action'] ?? '');
$entities = ['members' => 'users', 'plans' => 'plans', 'trainers' => 'trainers', 'services' => 'services', 'facilities' => 'facilities', 'payments' => 'payments', 'enquiries' => 'enquiries', 'applications' => 'membership_applications'];
$fields = [
    'members' => ['name', 'email', 'phone', 'plan', 'status', 'joined'],
    'plans' => ['name', 'price', 'duration', 'description'],
    'trainers' => ['name', 'photo', 'specialization', 'experience', 'contact'],
    'services' => ['name', 'description', 'status'],
    'facilities' => ['name', 'image', 'description'],
    'payments' => ['member', 'plan', 'amount', 'status', 'date'],
];

function askLocalModel(string $prompt): ?string
{
    $payload = json_encode([
        'model' => environment('OLLAMA_MODEL', 'llama3.2:3b'),
        'prompt' => "You are FITNESS Coach, a concise and encouraging gym assistant. Give practical, safe fitness guidance. Do not diagnose injuries or prescribe medical treatment.\n\nUser: " . $prompt,
        'stream' => false,
        'options' => ['temperature' => 0.6],
    ]);
    $context = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $payload, 'timeout' => 25, 'ignore_errors' => true]]);
    $response = @file_get_contents(rtrim(environment('OLLAMA_URL', 'http://127.0.0.1:11434'), '/') . '/api/generate', false, $context);
    if ($response === false) return null;
    $data = json_decode($response, true);
    $answer = is_array($data) ? trim((string) ($data['response'] ?? '')) : '';
    return $answer !== '' ? $answer : null;
}

try {
    database();

    if ($method === 'POST' && $action === 'register') {
        validateRequired($body, ['name', 'email', 'phone', 'dateOfBirth', 'gender', 'address', 'password']);
        $email = strtolower(cleanString($body['email'], 190));
        $password = (string) $body['password'];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
            jsonResponse(['success' => false, 'message' => 'Use a valid email and a password of at least 6 characters.'], 422);
        }
        if (findOne('users', ['email' => $email])) {
            jsonResponse(['success' => false, 'message' => 'This email is already registered.'], 409);
        }
        $result = collection('users')->insertOne([
            'name' => cleanString($body['name'], 120),
            'email' => $email,
            'phone' => cleanString($body['phone'], 30),
            'dateOfBirth' => cleanString($body['dateOfBirth'], 10),
            'gender' => cleanString($body['gender'], 30),
            'address' => cleanString($body['address'], 500),
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'status' => 'Active',
            'joined' => date('Y-m-d'),
            'created_at' => date('c'),
        ]);
        jsonResponse(['success' => true, 'message' => 'Registration successful.', 'id' => (string) $result->getInsertedId()]);
    }

    if ($method === 'POST' && in_array($action, ['login', 'admin_login'], true)) {
        $email = strtolower(cleanString($body['email'] ?? '', 190));
        $password = (string) ($body['password'] ?? '');
        $collectionName = $action === 'login' ? 'users' : 'admins';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            jsonResponse(['success' => false, 'message' => 'Enter a valid email and password.'], 400);
        }
        $account = collection($collectionName)->findOne(['email' => $email]);
        if (!$account || empty($account['password_hash']) || !password_verify($password, (string) $account['password_hash'])) {
            if ($action === 'login' && collection('admins')->countDocuments(['email' => $email]) > 0) {
                jsonResponse(['success' => false, 'message' => 'This is an admin account. Use the Admin Login link.'], 401);
            }
            jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
        }
        $accountId = (string) $account['_id'];
        $_SESSION[$action === 'login' ? 'user_id' : 'admin_id'] = $accountId;
        unset($_SESSION[$action === 'login' ? 'admin_id' : 'user_id']);
        $key = $action === 'login' ? 'user' : 'admin';
        jsonResponse(['success' => true, $key => ['id' => $accountId, 'name' => $account['name'], 'email' => $account['email']]]);
    }

    if ($method === 'POST' && $action === 'logout') {
        $_SESSION = [];
        session_destroy();
        jsonResponse(['success' => true]);
    }
    if ($method === 'GET' && $action === 'session') {
        jsonResponse(['success' => true, 'loggedIn' => !empty($_SESSION['user_id']), 'adminLoggedIn' => !empty($_SESSION['admin_id'])]);
    }

    if ($method === 'POST' && $action === 'ai_chat') {
        validateRequired($body, ['message']);
        $prompt = cleanString($body['message'], 1200);
        $context = cleanString($body['context'] ?? '', 300);
        $answer = askLocalModel($context !== '' ? $context . "\nUser question: " . $prompt : $prompt);
        if ($answer === null) {
            jsonResponse(['success' => false, 'available' => false, 'message' => 'Local AI is offline. Start Ollama and try again.'], 503);
        }
        jsonResponse(['success' => true, 'available' => true, 'answer' => $answer]);
    }

    if ($action === 'profile') {
        if (empty($_SESSION['user_id'])) {
            jsonResponse(['success' => false, 'message' => 'Member login required.'], 401);
        }
        $userFilter = idFilter($_SESSION['user_id']);
        if ($method === 'GET') {
            $user = findOne('users', $userFilter);
            if (!$user) {
                jsonResponse(['success' => false, 'message' => 'Member profile not found.'], 404);
            }
            $application = collection('membership_applications')->findOne(['user_id' => $_SESSION['user_id']], ['sort' => ['created_at' => -1]]);
            $user['application_status'] = $application['status'] ?? null;
            $user['application_plan'] = $application['plan'] ?? null;
            jsonResponse(['success' => true, 'profile' => $user]);
        }
        if ($method === 'POST') {
            validateRequired($body, ['name']);
            $name = cleanString($body['name'], 120);
            $phone = cleanString($body['phone'] ?? '', 30) ?: null;
            $password = (string) ($body['password'] ?? '');
            $update = [
                'name' => $name,
                'phone' => $phone,
                'dateOfBirth' => cleanString($body['dateOfBirth'] ?? '', 10) ?: null,
                'gender' => cleanString($body['gender'] ?? '', 30) ?: null,
                'address' => cleanString($body['address'] ?? '', 500) ?: null,
            ];
            if ($password !== '') {
                if (strlen($password) < 6) {
                    jsonResponse(['success' => false, 'message' => 'New password must be at least 6 characters.'], 422);
                }
                $update['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
            }
            collection('users')->updateOne($userFilter, ['$set' => $update]);
            jsonResponse(['success' => true, 'message' => 'Profile updated successfully.']);
        }
    }

    if ($method === 'POST' && $action === 'account_delete') {
        requireMember();
        $password = (string) ($body['password'] ?? '');
        $userFilter = idFilter($_SESSION['user_id']);
        $user = collection('users')->findOne($userFilter);
        if (!$user || $password === '' || !password_verify($password, (string) ($user['password_hash'] ?? ''))) {
            jsonResponse(['success' => false, 'message' => 'Enter your current password to delete the account.'], 401);
        }
        collection('membership_applications')->deleteMany(['user_id' => $_SESSION['user_id']]);
        collection('payments')->deleteMany(['user_id' => $_SESSION['user_id']]);
        collection('users')->deleteOne($userFilter);
        $_SESSION = [];
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Your account has been deleted.']);
    }

    if ($method === 'POST' && $action === 'join') {
        if (empty($_SESSION['user_id'])) {
            jsonResponse(['success' => false, 'message' => 'Please log in as a member before submitting a membership application.'], 401);
        }
        validateRequired($body, ['name', 'age', 'gender', 'phone', 'plan']);
        $applicationEmail = strtolower(cleanString($body['email'] ?? '', 190)) ?: null;
        $applicationFilter = ['user_id' => $_SESSION['user_id']];
        if ($applicationFilter && collection('membership_applications')->countDocuments($applicationFilter) > 0) {
            jsonResponse(['success' => false, 'message' => 'You have already submitted a membership application. Only one application is allowed per user.'], 409);
        }
        try {
            collection('membership_applications')->insertOne(['user_id' => $_SESSION['user_id'] ?? null, 'name' => cleanString($body['name'], 120), 'age' => max(10, min(100, (int) $body['age'])), 'gender' => cleanString($body['gender'], 20), 'phone' => cleanString($body['phone'], 30), 'email' => $applicationEmail, 'plan' => cleanString($body['plan'], 60), 'address' => cleanString($body['address'] ?? '', 1000) ?: null, 'emergencyName' => cleanString($body['emergencyName'] ?? '', 120) ?: null, 'emergencyPhone' => cleanString($body['emergencyPhone'] ?? '', 30) ?: null, 'status' => 'Pending', 'created_at' => date('c')]);
        } catch (Throwable $exception) {
            if (str_contains($exception->getMessage(), 'duplicate key')) {
                jsonResponse(['success' => false, 'message' => 'You have already submitted a membership application. Only one application is allowed per user.'], 409);
            }
            throw $exception;
        }
        jsonResponse(['success' => true, 'message' => 'Membership application submitted successfully.']);
    }
    if ($method === 'POST' && $action === 'contact') {
        validateRequired($body, ['name', 'message']);
        collection('enquiries')->insertOne(['name' => cleanString($body['name'], 120), 'email' => cleanString($body['email'] ?? '', 190) ?: null, 'phone' => cleanString($body['phone'] ?? '', 30) ?: null, 'message' => cleanString($body['message'], 2000), 'read' => false, 'created_at' => date('c')]);
        jsonResponse(['success' => true, 'message' => 'Message sent. We will get back to you soon.']);
    }

    if ($method === 'POST' && $action === 'create_payment') {
        if (empty($_SESSION['user_id'])) {
            jsonResponse(['success' => false, 'message' => 'Please log in as a member before starting checkout.'], 401);
        }
        validateRequired($body, ['plan', 'amount', 'payment_method']);
        $allowedAmounts = ['1 Month' => [2200, 2500], '3 Months' => [4200, 4500], '6 Months' => [7000, 7500], '1 Year' => [12000, 14000], 'Personal Training - 1 Month' => [5000], 'Personal Training - 3 Months' => [12000], 'Personal Training - 6 Months' => [30000], 'Personal Training - 12 Months' => [55000]];
        $plan = cleanString($body['plan'], 80);
        $amount = (float) $body['amount'];
        $methodName = cleanString($body['payment_method'], 30);
        $validAmount = isset($allowedAmounts[$plan]) && in_array($amount, array_map('floatval', $allowedAmounts[$plan]), true);
        if (!$validAmount) {
            jsonResponse(['success' => false, 'message' => 'Invalid plan amount. Please select a listed membership plan.'], 422);
        }
        if (!in_array($methodName, ['UPI', 'Card', 'Cash at desk'], true)) {
            jsonResponse(['success' => false, 'message' => 'Select a valid payment method.'], 422);
        }
        $payment = collection('payments')->insertOne(['user_id' => $_SESSION['user_id'], 'member' => cleanString($body['member'] ?? 'FITNESS Member', 120), 'plan' => $plan, 'amount' => $amount, 'payment_method' => $methodName, 'status' => 'Pending', 'date' => date('Y-m-d'), 'reference' => 'FIT-' . strtoupper(bin2hex(random_bytes(4))), 'created_at' => date('c')]);
        jsonResponse(['success' => true, 'message' => $methodName === 'Cash at desk' ? 'Checkout reserved. Complete payment at the FITNESS desk.' : 'Checkout created. Complete the payment using your selected method.', 'payment_id' => (string) $payment->getInsertedId()]);
    }

    requireAdmin();
    if ($method === 'GET' && $action === 'admin_dashboard') {
        $counts = ['users' => collection('users')->countDocuments(), 'trainers' => collection('trainers')->countDocuments(), 'plans' => collection('plans')->countDocuments(), 'payments' => collection('payments')->countDocuments(), 'active' => collection('membership_applications')->countDocuments(['status' => 'Approved']), 'expired' => collection('membership_applications')->countDocuments(['status' => 'Rejected']), 'newEnquiries' => collection('enquiries')->countDocuments(['read' => false])];
        $recent = array_map('normalizeDocument', collection('users')->find([], ['sort' => ['created_at' => -1], 'limit' => 4])->toArray());
        jsonResponse(['success' => true, 'stats' => $counts, 'recent' => $recent]);
    }
    if ($method === 'GET' && $action === 'admin_profile') {
        jsonResponse(['success' => true, 'admin' => findOne('admins', idFilter($_SESSION['admin_id']))]);
    }
    if ($method === 'POST' && $action === 'update_profile') {
        validateRequired($body, ['name', 'email']);
        $email = strtolower(cleanString($body['email'], 190));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['success' => false, 'message' => 'Enter a valid email address.'], 422);
        $duplicate = findOne('admins', ['email' => $email]);
        if ($duplicate && $duplicate['id'] !== $_SESSION['admin_id']) jsonResponse(['success' => false, 'message' => 'That email is already in use.'], 409);
        $update = ['name' => cleanString($body['name'], 120), 'email' => $email];
        if (($body['password'] ?? '') !== '') $update['password_hash'] = password_hash((string) $body['password'], PASSWORD_DEFAULT);
        collection('admins')->updateOne(idFilter($_SESSION['admin_id']), ['$set' => $update]);
        jsonResponse(['success' => true, 'message' => 'Profile updated successfully.']);
    }
    if ($method === 'GET' && isset($entities[$action])) jsonResponse(['success' => true, 'data' => findAll($entities[$action])]);
    if ($method === 'POST' && $action === 'save') {
        $entityName = cleanString($body['entity'] ?? '');
        if (!isset($fields[$entityName])) jsonResponse(['success' => false, 'message' => 'Invalid entity.'], 422);
        $data = is_array($body['data'] ?? null) ? $body['data'] : [];
        validateRequired($data, $fields[$entityName]);
        $record = [];
        foreach ($fields[$entityName] as $field) $record[$field] = cleanString($data[$field] ?? '', 2000);
        if ($entityName === 'payments') $record['amount'] = (float) $record['amount'];
        if ($entityName === 'members' && !filter_var($record['email'], FILTER_VALIDATE_EMAIL)) jsonResponse(['success' => false, 'message' => 'Enter a valid member email.'], 422);
        $collectionName = $entities[$entityName];
        if (cleanString((string) ($body['id'] ?? '')) !== '') collection($collectionName)->updateOne(idFilter(recordId($body['id'])), ['$set' => $record]);
        else collection($collectionName)->insertOne($record + ['created_at' => date('c')]);
        jsonResponse(['success' => true, 'message' => 'Record saved successfully.']);
    }
    if ($method === 'DELETE' && $action === 'delete') {
        $entityName = cleanString($_GET['entity'] ?? '');
        if (!isset($entities[$entityName]) || $entityName === 'enquiries') jsonResponse(['success' => false, 'message' => 'Invalid delete request.'], 422);
        collection($entities[$entityName])->deleteOne(idFilter(recordId($_GET['id'] ?? '')));
        jsonResponse(['success' => true, 'message' => 'Record deleted successfully.']);
    }
    if ($method === 'POST' && $action === 'toggle_enquiry') {
        $id = recordId($body['id'] ?? '');
        $enquiry = collection('enquiries')->findOne(idFilter($id));
        collection('enquiries')->updateOne(idFilter($id), ['$set' => ['read' => !((bool) ($enquiry['read'] ?? false))]]);
        jsonResponse(['success' => true]);
    }
    if ($method === 'POST' && $action === 'application_status') {
        validateRequired($body, ['id', 'status']);
        $status = cleanString($body['status'], 20);
        if (!in_array($status, ['Pending', 'Approved', 'Rejected'], true)) jsonResponse(['success' => false, 'message' => 'Invalid application status.'], 422);
        $id = recordId($body['id']);
        $application = collection('membership_applications')->findOne(idFilter($id));
        if (!$application) jsonResponse(['success' => false, 'message' => 'Application not found.'], 404);
        collection('membership_applications')->updateOne(idFilter($id), ['$set' => ['status' => $status]]);
        if ($status === 'Approved' && !empty($application['email'])) collection('users')->updateOne(['email' => strtolower((string) $application['email'])], ['$set' => ['name' => $application['name'], 'phone' => $application['phone'], 'plan' => $application['plan'], 'status' => 'Active', 'joined' => date('Y-m-d')]], ['upsert' => true]);
        jsonResponse(['success' => true, 'message' => 'Application updated.']);
    }
    jsonResponse(['success' => false, 'message' => 'Unknown API action.'], 404);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    jsonResponse(['success' => false, 'message' => 'Server error: ' . $exception->getMessage()], 500);
}
