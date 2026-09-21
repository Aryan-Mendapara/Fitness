<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$server = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$server->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$db = database();

$tables = [
    'admins' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'users' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, phone VARCHAR(30) NULL, plan VARCHAR(60) NULL, status VARCHAR(30) DEFAULT "Pending", joined DATE NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP',
    'plans' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, price DECIMAL(10,2) NOT NULL DEFAULT 0, duration VARCHAR(60) NOT NULL, description TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP',
    'trainers' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, photo TEXT NOT NULL, specialization VARCHAR(160) NOT NULL, experience VARCHAR(80) NOT NULL, contact VARCHAR(120) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP',
    'services' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, description TEXT NOT NULL, status VARCHAR(30) DEFAULT "Active", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP',
    'facilities' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, image TEXT NOT NULL, description TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP',
    'payments' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, member VARCHAR(120) NOT NULL, plan VARCHAR(120) NOT NULL, amount DECIMAL(10,2) NOT NULL DEFAULT 0, status VARCHAR(30) DEFAULT "Pending", date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP',
    'membership_applications' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NULL, name VARCHAR(120) NOT NULL, age TINYINT UNSIGNED NOT NULL, gender VARCHAR(20) NOT NULL, phone VARCHAR(30) NOT NULL, email VARCHAR(190) NULL, plan VARCHAR(60) NOT NULL, address TEXT NULL, emergencyName VARCHAR(120) NULL, emergencyPhone VARCHAR(30) NULL, status VARCHAR(30) DEFAULT "Pending", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'enquiries' => 'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL, phone VARCHAR(30) NOT NULL, message TEXT NOT NULL, read_status TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
];
foreach ($tables as $table => $definition) $db->exec("CREATE TABLE IF NOT EXISTS `{$table}` ({$definition}) ENGINE=InnoDB");

$statement = $db->prepare('SELECT COUNT(*) FROM admins WHERE email = ?');
$statement->execute(['admin@fitness.com']);
if (!(int) $statement->fetchColumn()) {
    $statement = $db->prepare('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)');
    $statement->execute(['Fitness Admin', 'admin@fitness.com', password_hash('admin123', PASSWORD_DEFAULT)]);
}
$statement = $db->query('SELECT COUNT(*) FROM plans');
if (!(int) $statement->fetchColumn()) {
    $statement = $db->prepare('INSERT INTO plans (name, price, duration, description) VALUES (?, ?, ?, ?)');
    foreach ([['Basic', 999, '1 Month', 'Gym access and locker.'], ['Standard', 2499, '3 Months', 'Gym access and group classes.'], ['Premium', 7999, '12 Months', 'All access with personal training.']] as $plan) $statement->execute($plan);
}
echo "FITNESS MySQL backend installed. Admin: admin@fitness.com / admin123\n";
