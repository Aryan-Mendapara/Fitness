<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

database();
echo "FITNESS backend is ready.\n";
echo "Admin login: admin@fitness.com / admin123\n";
echo "MongoDB database: " . environment('MONGODB_DATABASE', 'fitness') . "\n";
