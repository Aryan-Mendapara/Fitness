document.addEventListener('DOMContentLoaded', function () {
    var apiUrl = (window.FITNESS_CONFIG && window.FITNESS_CONFIG.apiBaseUrl) || '../../backend/api.php';
    var authActions = document.querySelector('.nav__actions');
    var loginForm = document.querySelector('.login__form');
    var loginBack = document.getElementById('login-back');
    var passwordInput = document.getElementById('password');
    var passwordToggle = document.getElementById('password-toggle');

    document.querySelectorAll('#program-add-button, #service-add-button, #program-modal').forEach(function (node) {
        if (node) node.remove();
    });

    function request(action, options) {
        options = options || {};
        options.credentials = 'same-origin';
        options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        return fetch(apiUrl + '?action=' + encodeURIComponent(action), options).then(function (response) {
            return response.text().then(function (text) {
                var data;
                if (!text.trim()) {
                    throw new Error('Backend is not running. Start it in the project folder with: php -S localhost:8000 -t .');
                }
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    throw new Error('Backend returned an invalid response. Start the PHP server in the project folder instead of opening the HTML file directly.');
                }
                if (!response.ok || !data.success) throw new Error(data.message || 'Request failed.');
                return data;
            });
        });
    }

    function applyAuthState(session) {
        document.querySelectorAll('.join-now-link').forEach(function (link) {
            link.href = session.loggedIn ? 'join.html' : 'login.html';
        });
        document.querySelectorAll('.auth-home-link').forEach(function (link) {
            link.href = session.loggedIn ? 'join.html' : 'login.html';
        });
        if (!authActions) return;
        if (session.adminLoggedIn) {
            authActions.innerHTML = '<a href="admin.html" class="btn btn--secondary">Admin</a><button type="button" class="btn btn--secondary" id="logout-button"><i class="bi bi-box-arrow-right auth-icon"></i>Logout</button><a href="join.html" class="btn join-now-link">Join Now</a>';
        } else if (session.loggedIn) {
            authActions.innerHTML = '<a href="ai-coach.html" class="btn btn--secondary"><i class="bi bi-stars auth-icon"></i>AI Coach</a><a href="profile.html" class="btn btn--secondary"><i class="bi bi-person auth-icon"></i>Profile</a><button type="button" class="btn btn--secondary" id="logout-button"><i class="bi bi-box-arrow-right auth-icon"></i>Logout</button><a href="join.html" class="btn join-now-link">Join Now</a>';
        } else {
            return;
        }
        var logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', function () {
                request('logout', { method: 'POST' }).then(function () { window.location.href = '../index.html'; });
            });
        }
    }

    request('session').then(function (session) {
        applyAuthState(session);
        if (document.body.classList.contains('home-page') && !session.loggedIn && !session.adminLoggedIn) {
            window.location.href = 'login.html';
            return;
        }
        if (loginForm && (session.loggedIn || session.adminLoggedIn)) {
            window.location.href = session.adminLoggedIn ? 'admin.html' : 'index.html';
        }
    }).catch(function () {
        applyAuthState({ loggedIn: false, adminLoggedIn: false });
    });

    if (loginBack) {
        loginBack.addEventListener('click', function () {
            window.location.href = 'index.html';
        });
    }

    if (passwordInput && passwordToggle) {
        passwordToggle.addEventListener('click', function () {
            var isHidden = passwordInput.type === 'password';
            passwordInput.type = isHidden ? 'text' : 'password';
            passwordToggle.textContent = isHidden ? 'Hide' : 'Show';
            passwordToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var errorNode = document.getElementById('login-error');
            errorNode.textContent = '';
            request('login', {
                method: 'POST',
                body: JSON.stringify({
                    email: document.getElementById('email').value.trim(),
                    password: document.getElementById('password').value
                })
            }).then(function () {
                sessionStorage.setItem('fitness-page-transition', 'true');
                window.location.href = 'index.html';
            }).catch(function (error) {
                errorNode.textContent = error.message;
            });
        });
    }

    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var note = document.getElementById('contact-note');
            request('contact', {
                method: 'POST',
                body: JSON.stringify({
                    name: document.getElementById('contact-name').value.trim(),
                    email: document.getElementById('contact-email').value.trim(),
                    phone: document.getElementById('contact-phone').value.trim(),
                    message: document.getElementById('contact-message').value.trim()
                })
            }).then(function (result) {
                note.textContent = result.message;
                contactForm.reset();
            }).catch(function (error) {
                note.textContent = error.message;
            });
        });
    }
});
