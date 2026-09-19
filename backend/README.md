# FITNESS PHP + MongoDB backend

1. Install PHP, the MongoDB PHP extension, Composer, and MongoDB Community Server or MongoDB Atlas.
2. From this folder run `composer install`.
3. Set `MONGODB_URI` and `MONGODB_DATABASE` in `config.php` if MongoDB is not local.
4. Run `php install.php` once to create the default admin and starter plans.
5. Serve the project from the project root, for example `php -S localhost:8000`, then open `http://localhost:8000/Frontend/index.html`.

Default admin login: `admin@fitness.com` / `admin123`. Change this password before deploying.
