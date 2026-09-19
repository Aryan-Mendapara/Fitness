document.addEventListener('DOMContentLoaded', function () {
    var apiUrl = '../backend/api.php';
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

    function request(action, options) {
        options = options || {};
        options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        return fetch(apiUrl + '?action=' + encodeURIComponent(action), options).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) throw new Error(data.message || 'Request failed.');
                return data;
            });
        });
    }

    function applyAuthState(session) {
        document.querySelectorAll('.join-now-link').forEach(function (link) {
            link.href = session.loggedIn ? 'membership.html' : 'login.html';
        });
        if (!authActions || (!session.loggedIn && !session.adminLoggedIn)) return;
        authActions.innerHTML = '<button type="button" class="btn btn--secondary" id="logout-button"><i class="bi bi-box-arrow-right auth-icon"></i>Logout</button><a href="membership.html" class="btn join-now-link">Join Now</a>';
        document.getElementById('logout-button').addEventListener('click', function () {
            request('logout', { method: 'POST' }).then(function () { window.location.href = 'index.html'; });
        });
    }

    request('session').then(function (session) {
        applyAuthState(session);
        if (loginForm && (session.loggedIn || session.adminLoggedIn)) window.location.href = 'service.html';
    }).catch(function () { applyAuthState({ loggedIn: false, adminLoggedIn: false }); });

    if (loginForm) loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        request('login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('email').value.trim(), password: document.getElementById('password').value }) })
            .then(function () { window.location.href = 'service.html'; })
            .catch(function (error) { document.getElementById('login-error').textContent = error.message; });
    });
});
