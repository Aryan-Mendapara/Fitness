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

        var api = window.location.port === '5500' ? window.location.protocol + '//' + window.location.hostname + '/Fitness/backend/api.php' : '../backend/api.php';
        fetch(api + '?action=register', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        }).then(function (response) {
            return response.text().then(function (text) {
                var data;
                try { data = JSON.parse(text); } catch (parseError) { throw new Error('PHP API unavailable. Open the website through http://localhost/Fitness.'); }
                if (!response.ok || !data.success) throw new Error(data.message || 'Registration failed.');
                return data;
            });
        }).then(function () {
            error.textContent = '';
            window.location.href = 'login.html';
        }).catch(function (requestError) { error.textContent = requestError.message; });
    });
});
