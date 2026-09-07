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

        localStorage.setItem('fitnessUserEmail', email);
        localStorage.setItem('fitnessUserPassword', password);
        localStorage.removeItem('fitnessLoggedIn');
        error.textContent = '';
        window.location.href = 'login.html';
    });
});
