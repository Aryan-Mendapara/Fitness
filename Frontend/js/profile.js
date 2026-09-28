document.addEventListener('DOMContentLoaded', function () {
    var api = (window.FITNESS_CONFIG && window.FITNESS_CONFIG.apiBaseUrl) || '../../backend/api.php';
    var form = document.getElementById('profile-form');
    var note = document.getElementById('profile-note');

    function request(action, options) {
        options = options || {};
        options.credentials = 'same-origin';
        options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        return fetch(api + '?action=' + encodeURIComponent(action), options).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) throw new Error(data.message || 'Request failed.');
                return data;
            });
        });
    }

    function fillProfile(profile) {
        document.getElementById('profile-avatar').textContent = (profile.name || 'F').charAt(0).toUpperCase();
        document.getElementById('profile-name').textContent = profile.name || 'FITNESS Member';
        document.getElementById('profile-email').textContent = profile.email || '';
        document.getElementById('profile-name-input').value = profile.name || '';
        document.getElementById('profile-email-input').value = profile.email || '';
        document.getElementById('profile-phone-input').value = profile.phone || '';
        document.getElementById('profile-dob-input').value = profile.dateOfBirth || '';
        document.getElementById('profile-gender-input').value = profile.gender || '';
        document.getElementById('profile-address-input').value = profile.address || '';
        document.getElementById('profile-plan').textContent = profile.plan || profile.application_plan || 'Not selected';
        document.getElementById('profile-joined').textContent = profile.joined || 'Not available';
        document.getElementById('profile-application').textContent = profile.application_status || 'Not submitted';
        document.getElementById('profile-status').textContent = profile.status || 'Active';
    }

    request('profile').then(function (result) {
        fillProfile(result.profile);
    }).catch(function (error) {
        window.location.href = 'login.html';
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        note.textContent = '';
        request('profile', { method: 'POST', body: JSON.stringify({
            name: document.getElementById('profile-name-input').value.trim(),
            phone: document.getElementById('profile-phone-input').value.trim(),
            dateOfBirth: document.getElementById('profile-dob-input').value,
            gender: document.getElementById('profile-gender-input').value,
            address: document.getElementById('profile-address-input').value.trim(),
            password: document.getElementById('profile-password-input').value
        }) }).then(function (result) {
            note.textContent = result.message;
            document.getElementById('profile-password-input').value = '';
            return request('profile');
        }).then(function (result) {
            fillProfile(result.profile);
        }).catch(function (error) {
            note.textContent = error.message;
        });
    });

    document.getElementById('logout-button').addEventListener('click', function () {
        request('logout', { method: 'POST' }).then(function () { window.location.href = '../index.html'; });
    });

    document.getElementById('delete-account-button').addEventListener('click', function () {
        var password = document.getElementById('delete-password-input').value;
        if (!password) {
            note.textContent = 'Enter your current password to delete the account.';
            return;
        }
        if (!window.confirm('Delete your FITNESS account permanently? This cannot be undone.')) return;
        request('account_delete', { method: 'POST', body: JSON.stringify({ password: password }) }).then(function () {
            window.location.href = '../index.html';
        }).catch(function (error) {
            note.textContent = error.message;
        });
    });
});
