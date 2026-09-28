document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('register-form');
    var error = document.getElementById('register-error');

    document.getElementById('register-back').addEventListener('click', function () {
        window.location.href = 'login.html';
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        var name = document.getElementById('register-name').value.trim();
        var email = document.getElementById('register-email').value.trim().toLowerCase();
        var phone = document.getElementById('register-phone').value.trim();
        var dateOfBirth = document.getElementById('register-dob').value;
        var gender = document.getElementById('register-gender').value;
        var address = document.getElementById('register-address').value.trim();
        var password = document.getElementById('register-password').value;
        var confirm = document.getElementById('register-confirm').value;

        if (!phone || !dateOfBirth || !gender || !address) {
            error.textContent = 'Please complete your contact and profile information.';
            return;
        }
        if (password.length < 6) {
            error.textContent = 'Password must be at least 6 characters.';
            return;
        }
        if (password !== confirm) {
            error.textContent = 'Passwords do not match.';
            return;
        }

        var apiUrl = (window.FITNESS_CONFIG && window.FITNESS_CONFIG.apiBaseUrl) || '../../backend/api.php';
        fetch(apiUrl + '?action=register', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, phone: phone, dateOfBirth: dateOfBirth, gender: gender, address: address, password: password })
        }).then(function (response) {
            return response.text().then(function (text) {
                var data;
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    throw new Error('Backend is not running. Start it in the project folder with: php -S localhost:8000 -t .');
                }
                if (!response.ok || !data.success) throw new Error(data.message || 'Registration failed.');
                return data;
            });
        }).then(function () {
            error.textContent = '';
            window.location.href = 'login.html';
        }).catch(function (requestError) {
            error.textContent = requestError.message;
        });
    });
});
