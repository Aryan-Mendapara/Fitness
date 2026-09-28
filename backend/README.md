# FITNESS backend

This backend uses MongoDB through the official PHP MongoDB driver and Composer package.

Backend settings are loaded from `.env`: `MONGODB_URI`, `MONGODB_DATABASE`, `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Copy `.env.example` when setting up a new installation and change the admin password.

## Free local AI Coach

Install Ollama, then download the free local model:

```powershell
winget install Ollama.Ollama
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull llama3.2:3b
```

Ollama should run at `http://127.0.0.1:11434`. The AI Coach calls it through the PHP backend. If Ollama is unavailable, the coach keeps its offline guidance instead of exposing an error to visitors.

## Run the site

Open a terminal in the project root and run:

```
C:\xampp\php\php.exe -S localhost:8000
```

The `-t .` form is also supported and makes the document root explicit:

```
C:\xampp\php\php.exe -S localhost:8000 -t .
```

2. Open `http://localhost:8000/Frontend/index.html`

Do not open the HTML files directly from Disk (`file://`). Login and admin need the PHP server.

Default admin login: `admin@fitness.com` / `admin123`

Run `C:\xampp\php\php.exe backend/install.php` once from the project root. Collections and seed data are also created automatically on the first API request.

Members must be logged in to submit an application. MongoDB enforces one membership application per member.
