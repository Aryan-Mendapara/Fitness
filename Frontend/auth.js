document.addEventListener('DOMContentLoaded', function () {
    var apiUrl = window.location.port === '5500' ? window.location.protocol + '//' + window.location.hostname + '/Fitness/backend/api.php' : '../backend/api.php';
    var authActions = document.querySelector('.nav__actions');
    var loginForm = document.querySelector('.login__form');
    var programModal = document.getElementById('program-modal');
    var addButtons = document.querySelectorAll('#program-add-button, #service-add-button');

    if (!document.querySelector('.site-sidebar')) {
        document.body.classList.add('has-site-sidebar');
        document.body.insertAdjacentHTML('afterbegin', '<aside class="site-sidebar"><a class="site-sidebar-brand" href="index.html"><img src="assets/FITNESS LOGO.png" alt="FITNESS Logo"></a><p class="site-sidebar-label">USER WEBSITE</p><nav class="site-sidebar-nav" aria-label="User website navigation"><a href="index.html"><i class="bi bi-house-door"></i><span>Home</span></a><a href="program.html"><i class="bi bi-building"></i><span>Facilities</span></a><a href="membership.html"><i class="bi bi-card-checklist"></i><span>Membership</span></a><a href="service.html"><i class="bi bi-person-workspace"></i><span>Services</span></a><a href="about.html"><i class="bi bi-info-circle"></i><span>About</span></a><a href="community.html"><i class="bi bi-people"></i><span>Community</span></a><a class="site-sidebar-admin" href="admin.html"><i class="bi bi-grid-1x2"></i><span>Admin Panel</span></a></nav></aside>');
    }

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
        options.credentials = 'include';
        return fetch(apiUrl + '?action=' + encodeURIComponent(action), options).then(function (response) {
            return response.text().then(function (text) {
                var data;
                try { data = JSON.parse(text); } catch (error) { throw new Error('PHP API unavailable. Open the website through http://localhost/Fitness, not Live Server.'); }
                if (!response.ok || !data.success) throw new Error(data.message || 'Request failed.');
                return data;
            });
        });
    }

    function applyAuthState(session) {
        document.querySelectorAll('.section-add__button').forEach(function (button) {
            button.hidden = !session.adminLoggedIn;
        });
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
