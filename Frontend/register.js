document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('register-form');
    var error = document.getElementById('register-error');

    document.getElementById('register-back').addEventListener('click', function () {
        window.location.href = 'login.html';
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        var email = document.getElementById('register-email').value.trim().toLowerCase();
        var password = document.getElementById('register-password').value;

        if (password.length < 6) {
            error.textContent = 'Password must be at least 6 characters.';
            return;
        }

        fetch('../backend/api.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        }).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) throw new Error(data.message || 'Registration failed.');
                return data;
            });
        }).then(function () {
            error.textContent = '';
            window.location.href = 'login.html';
        }).catch(function (requestError) { error.textContent = requestError.message; });
    });
});
