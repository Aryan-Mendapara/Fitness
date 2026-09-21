# FITNESS PHP + MySQL backend

1. Install XAMPP and start **Apache** and **MySQL**.
2. Copy the `Fitness` folder to `C:/xampp/htdocs/Fitness`.
3. Open `http://localhost/phpmyadmin` once, then visit `http://localhost/Fitness/backend/install.php` to create the database and tables.
4. Open `http://localhost/Fitness/Frontend/index.html`.
5. Default admin: `admin@fitness.com` / `admin123`. Change it before deployment.

The backend uses PHP PDO with the XAMPP MySQL defaults: host `127.0.0.1`, user `root`, empty password, database `fitness_gym`. Override them with `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` environment variables when needed.
