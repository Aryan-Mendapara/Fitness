<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$db = database();
$adminEmail = 'admin@fitness.com';
if ($db->admins->countDocuments(['email' => $adminEmail]) === 0) {
    $db->admins->insertOne([
        'name' => 'Fitness Admin',
        'email' => $adminEmail,
        'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
        'created_at' => new MongoDB\BSON\UTCDateTime(),
    ]);
}

if ($db->plans->countDocuments() === 0) {
    $db->plans->insertMany([
        ['name' => 'Basic', 'price' => 999, 'duration' => '1 Month', 'description' => 'Gym access and locker.', 'created_at' => new MongoDB\BSON\UTCDateTime()],
        ['name' => 'Standard', 'price' => 2499, 'duration' => '3 Months', 'description' => 'Gym access and group classes.', 'created_at' => new MongoDB\BSON\UTCDateTime()],
        ['name' => 'Premium', 'price' => 7999, 'duration' => '12 Months', 'description' => 'All access with personal training.', 'created_at' => new MongoDB\BSON\UTCDateTime()],
    ]);
}

echo "FITNESS MongoDB backend installed. Admin: admin@fitness.com / admin123\n";
