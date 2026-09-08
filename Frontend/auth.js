document.addEventListener('DOMContentLoaded', function () {
    var isLoggedIn = localStorage.getItem('fitnessLoggedIn') === 'true' ||
        localStorage.getItem('fitnessAdminLoggedIn') === 'true';
    var authActions = document.querySelector('.nav__actions');
    var loginForm = document.querySelector('.login__form');
    var programModal = document.getElementById('program-modal');
    var addButtons = document.querySelectorAll('#program-add-button, #service-add-button');

    if (addButtons.length && programModal) {
        addButtons.forEach(function (addButton) {
            addButton.addEventListener('click', function () {
                var itemName = addButton.id === 'service-add-button' ? 'Service' : 'Program';
                document.getElementById('add-item-title').textContent = 'Add ' + itemName;
                document.getElementById('add-item-submit').textContent = 'Add ' + itemName;
                programModal.showModal();
            });
        });

        document.getElementById('program-cancel').addEventListener('click', function () {
            programModal.close();
        });

        programModal.addEventListener('click', function (event) {
            if (event.target === programModal) programModal.close();
        });
    }

    document.querySelectorAll('.join-now-link').forEach(function (link) {
        link.href = isLoggedIn ? 'membership.html' : 'login.html';
    });

    if (authActions && isLoggedIn) {
        authActions.innerHTML = '<button type="button" class="btn btn--secondary" id="logout-button"><i class="bi bi-box-arrow-right auth-icon"></i>Logout</button><a href="membership.html" class="btn join-now-link">Join Now</a>';
        document.getElementById('logout-button').addEventListener('click', function () {
            localStorage.removeItem('fitnessLoggedIn');
            localStorage.removeItem('fitnessAdminLoggedIn');
            authActions.innerHTML = '<a href="login.html" class="btn btn--secondary"><i class="bi bi-box-arrow-in-right auth-icon"></i>Login</a><a href="login.html" class="btn join-now-link">Join Now</a>';
        });
    }

    if (loginForm) {
        if (isLoggedIn) {
            window.location.href = 'service.html';
            return;
        }

        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var registeredEmail = localStorage.getItem('fitnessUserEmail');
            var registeredPassword = localStorage.getItem('fitnessUserPassword');
            var email = document.getElementById('email').value.trim().toLowerCase();
            var password = document.getElementById('password').value;
            var loginError = document.getElementById('login-error');

            if (!registeredEmail || !registeredPassword) {
                loginError.textContent = 'Please register before logging in.';
                return;
            }

            if (email !== registeredEmail || password !== registeredPassword) {
                loginError.textContent = 'Invalid email or password.';
                return;
            }

            loginError.textContent = '';
            localStorage.setItem('fitnessLoggedIn', 'true');
            window.location.href = 'service.html';
        });
    }
});
