document.addEventListener('DOMContentLoaded', function () {
    var api = (window.FITNESS_CONFIG && window.FITNESS_CONFIG.apiBaseUrl) || '../../backend/api.php';
    var login = document.getElementById('admin-login');
    var dashboard = document.getElementById('admin-dashboard');
    var modal = document.getElementById('admin-modal');
    var modalForm = document.getElementById('entity-form');
    var modalFields = document.getElementById('modal-fields');
    var detailsModal = document.getElementById('details-modal');
    var detailsContent = document.getElementById('details-content');
    var detailsTitle = document.getElementById('details-title');
    var currentEntity = '';
    var editingId = null;
    var fields = {
        members: [['name', 'Member Name'], ['email', 'Email', 'email'], ['phone', 'Phone'], ['plan', 'Plan'], ['status', 'Membership Status', 'select', ['Active', 'Expired', 'Pending']], ['joined', 'Joined Date', 'date']],
        plans: [['name', 'Plan Name'], ['price', 'Price'], ['duration', 'Duration'], ['description', 'Description', 'textarea']],
        trainers: [['name', 'Trainer Name'], ['photo', 'Profile Photo URL'], ['specialization', 'Specialization'], ['experience', 'Experience'], ['contact', 'Contact Details']],
        services: [['name', 'Service Name'], ['description', 'Description', 'textarea'], ['status', 'Status', 'select', ['Active', 'Inactive']]],
        facilities: [['name', 'Facility Name'], ['image', 'Facility Image URL'], ['description', 'Description', 'textarea']],
        payments: [['member', 'Member Name'], ['plan', 'Plan'], ['amount', 'Amount', 'number'], ['status', 'Payment Status', 'select', ['Paid', 'Pending', 'Failed']], ['date', 'Payment Date', 'date']]
    };
    var labels = { members: 'Member', plans: 'Plan', trainers: 'Trainer', services: 'Service', facilities: 'Facility', payments: 'Payment' };
    var cache = {};

    function request(action, options) {
        options = options || {};
        options.credentials = 'same-origin';
        options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        return fetch(api + '?action=' + encodeURIComponent(action), options).then(function (response) {
            return response.text().then(function (text) {
                var data;
                if (!text.trim()) {
                    throw new Error('Backend is not running. Start it in the project folder with: php -S localhost:8000 -t .');
                }
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    throw new Error('Backend returned an invalid response. Start the PHP server in the project folder.');
                }
                if (!response.ok || !data.success) throw new Error(data.message || 'Request failed.');
                return data;
            });
        });
    }

    function escapeHTML(value) {
        return String(value === null || value === undefined ? '' : value).replace(/[&<>'"]/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
        });
    }

    function prettyLabel(key) {
        return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^[a-z]/, function (letter) { return letter.toUpperCase(); });
    }

    function showDetails(entity, item) {
        detailsTitle.textContent = (labels[entity] || prettyLabel(entity)) + ' details';
        detailsContent.innerHTML = Object.keys(item).filter(function (key) {
            return key !== 'password_hash';
        }).map(function (key) {
            var value = item[key];
            if (value === null || value === undefined || value === '') value = 'Not provided';
            if (typeof value === 'object') value = JSON.stringify(value);
            return '<div class="detail-item"><dt>' + escapeHTML(prettyLabel(key)) + '</dt><dd>' + escapeHTML(value) + '</dd></div>';
        }).join('');
        detailsModal.showModal();
    }

    function showNotice(message) {
        var note = document.getElementById('admin-note');
        note.textContent = message;
        window.setTimeout(function () { note.textContent = ''; }, 3000);
    }

    function tableToolbar(entity, count) {
        return '<div class="admin-table-toolbar"><span><b>' + count + '</b> records</span><label><i class="bi bi-search"></i><input class="admin-table-search" type="search" placeholder="Search ' + escapeHTML(labels[entity] || entity) + '..."></label></div>';
    }

    function loadEntity(entity) {
        return request(entity).then(function (result) {
            cache[entity] = result.data;
            return result.data;
        });
    }

    function renderTable(entity) {
        loadEntity(entity).then(function (data) {
            var target = document.getElementById(entity + '-table');
            if (!target) return;
            if (entity === 'enquiries') {
                target.innerHTML = data.length
                    ? tableToolbar(entity, data.length) + '<table><thead><tr><th>Name</th><th>Contact</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
                    data.map(function (item) {
                        return '<tr class="' + (item.read ? '' : 'row-unread') + '"><td><strong>' + escapeHTML(item.name) + '</strong></td><td>' + escapeHTML(item.email) + '<small>' + escapeHTML(item.phone) + '</small></td><td>' + escapeHTML(item.message) + '</td><td>' + (item.read ? 'Read' : 'New') + '</td><td><button class="table-action" data-action="details" data-entity="enquiries" data-id="' + item.id + '">View details</button><button class="table-action" data-action="read" data-id="' + item.id + '">' + (item.read ? 'Unread' : 'Read') + '</button></td></tr>';
                    }).join('') + '</tbody></table>'
                    : tableToolbar(entity, 0) + '<p class="admin-empty">No enquiries yet.</p>';
                return;
            }
            if (entity === 'applications') {
                target.innerHTML = data.length
                    ? tableToolbar(entity, data.length) + '<table><thead><tr><th>Name</th><th>Plan</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
                    data.map(function (item) {
                        return '<tr><td><strong>' + escapeHTML(item.name) + '</strong><small>' + escapeHTML(item.email) + '</small></td><td>' + escapeHTML(item.plan) + '</td><td>' + escapeHTML(item.phone) + '</td><td>' + escapeHTML(item.status) + '</td><td><button class="table-action" data-action="details" data-entity="applications" data-id="' + item.id + '">View details</button><button class="table-action" data-action="approve" data-id="' + item.id + '">Approve</button><button class="table-action table-delete" data-action="reject" data-id="' + item.id + '">Reject</button></td></tr>';
                    }).join('') + '</tbody></table>'
                    : tableToolbar(entity, 0) + '<p class="admin-empty">No membership applications yet.</p>';
                return;
            }
            var columns = Object.keys(data[0] || {}).filter(function (key) {
                return key !== 'id' && key !== 'password_hash';
            });
            target.innerHTML = data.length
                ? tableToolbar(entity, data.length) + '<table><thead><tr>' + columns.map(function (key) { return '<th>' + key.replace(/^[a-z]/, function (letter) { return letter.toUpperCase(); }) + '</th>'; }).join('') + '<th>Actions</th></tr></thead><tbody>' +
                data.map(function (item) {
                    return '<tr>' + columns.map(function (key) { return '<td>' + escapeHTML(item[key]) + '</td>'; }).join('') +
                        '<td><button class="table-action" data-action="details" data-entity="' + entity + '" data-id="' + item.id + '">View details</button><button class="table-action" data-action="edit" data-entity="' + entity + '" data-id="' + item.id + '">Edit</button><button class="table-action table-delete" data-action="delete" data-entity="' + entity + '" data-id="' + item.id + '">Delete</button></td></tr>';
                }).join('') + '</tbody></table>'
                : tableToolbar(entity, 0) + '<p class="admin-empty">No records yet. Add the first one.</p>';
        }).catch(function (error) {
            showNotice(error.message);
        });
    }

    function renderDashboard() {
        request('admin_dashboard').then(function (result) {
            var stats = result.stats;
            document.querySelector('[data-stat="members"]').textContent = stats.users || 0;
            document.querySelector('[data-stat="active"]').textContent = stats.active || 0;
            document.querySelector('[data-stat="expired"]').textContent = stats.expired || 0;
            document.querySelector('[data-stat="trainers"]').textContent = stats.trainers || 0;
            document.querySelector('[data-stat="enquiries"]').textContent = stats.newEnquiries || 0;
            document.querySelector('[data-stat="recent"]').textContent = (result.recent || []).length;
            document.getElementById('recent-members').innerHTML = (result.recent || []).map(function (item) {
                return '<div class="recent-member"><span><strong>' + escapeHTML(item.name) + '</strong><small>' + escapeHTML(item.email) + '</small></span><button class="table-action" data-action="recent-details" data-id="' + item.id + '">View details</button></div>';
            }).join('') || '<p class="admin-empty">No members yet.</p>';
        }).catch(function (error) {
            showNotice(error.message);
        });
    }

    function loadProfile() {
        request('admin_profile').then(function (result) {
            var form = document.getElementById('profile-form');
            if (!result.admin || !form) return;
            form.name.value = result.admin.name || '';
            form.email.value = result.admin.email || '';
            document.getElementById('admin-user-chip').textContent = result.admin.name || 'Administrator';
        }).catch(function (error) {
            showNotice(error.message);
        });
    }

    function showSection(section) {
        document.querySelectorAll('.admin-nav-item').forEach(function (item) {
            item.classList.toggle('is-active', item.dataset.section === section);
        });
        document.querySelectorAll('.admin-view').forEach(function (view) {
            view.classList.toggle('is-visible', view.dataset.view === section);
        });
        var navItem = document.querySelector('[data-section="' + section + '"]');
        document.getElementById('section-title').textContent = section === 'dashboard' ? 'Dashboard' : (navItem ? navItem.textContent : section);
        if (section === 'dashboard') renderDashboard();
        else if (section === 'profile') loadProfile();
        else renderTable(section);
    }

    function openModal(entity, id) {
        currentEntity = entity;
        editingId = id || null;
        var item = id && cache[entity] ? cache[entity].find(function (record) { return String(record.id) === String(id); }) : {};
        document.getElementById('modal-title').textContent = (id ? 'Edit ' : 'Add ') + labels[entity];
        modalFields.innerHTML = fields[entity].map(function (field) {
            var type = field[2] || 'text';
            var value = escapeHTML(item[field[0]] || '');
            if (type === 'select') {
                return '<label>' + field[1] + '<select name="' + field[0] + '">' + field[3].map(function (option) {
                    return '<option ' + (option === item[field[0]] ? 'selected' : '') + '>' + option + '</option>';
                }).join('') + '</select></label>';
            }
            if (type === 'textarea') {
                return '<label>' + field[1] + '<textarea name="' + field[0] + '" required>' + value + '</textarea></label>';
            }
            return '<label>' + field[1] + '<input type="' + type + '" name="' + field[0] + '" value="' + value + '" required></label>';
        }).join('');
        modal.showModal();
    }

    document.querySelectorAll('.admin-nav-item').forEach(function (button) {
        button.addEventListener('click', function () { showSection(button.dataset.section); });
    });
    document.querySelectorAll('[data-go]').forEach(function (button) {
        button.addEventListener('click', function () { showSection(button.dataset.go); });
    });
    document.querySelectorAll('.admin-add').forEach(function (button) {
        button.addEventListener('click', function () { openModal(button.dataset.entity); });
    });
    document.getElementById('admin-refresh').addEventListener('click', function () {
        var section = document.querySelector('.admin-view.is-visible').dataset.view;
        if (section === 'dashboard') renderDashboard();
        else if (section === 'profile') loadProfile();
        else renderTable(section);
        showNotice('Refreshing ' + section + ' data...');
    });
    document.addEventListener('input', function (event) {
        var search = event.target.closest('.admin-table-search');
        if (!search) return;
        var query = search.value.trim().toLowerCase();
        var table = search.closest('.admin-table-wrap').querySelector('tbody');
        if (!table) return;
        Array.prototype.forEach.call(table.rows, function (row) {
            row.hidden = query !== '' && row.textContent.toLowerCase().indexOf(query) === -1;
        });
    });
    document.addEventListener('click', function (event) {
        var action = event.target.closest('[data-action]');
        if (!action) return;
        if (action.dataset.action === 'details' || action.dataset.action === 'recent-details') {
            var detailEntity = action.dataset.entity || 'members';
            var detailItem = (cache[detailEntity] || []).find(function (record) { return String(record.id) === String(action.dataset.id); });
            if (detailItem) showDetails(detailEntity, detailItem);
            else if (action.dataset.action === 'recent-details') request('members').then(function (result) {
                cache.members = result.data;
                var member = result.data.find(function (record) { return String(record.id) === String(action.dataset.id); });
                if (member) showDetails('members', member);
            });
            return;
        }
        if (action.dataset.action === 'edit') openModal(action.dataset.entity, action.dataset.id);
        if (action.dataset.action === 'delete' && window.confirm('Delete this record?')) {
            fetch(api + '?action=delete&entity=' + encodeURIComponent(action.dataset.entity) + '&id=' + encodeURIComponent(action.dataset.id), {
                method: 'DELETE',
                credentials: 'same-origin'
            }).then(function (response) {
                return response.json().then(function (data) {
                    if (!response.ok || !data.success) throw new Error(data.message || 'Delete failed.');
                    return data;
                });
            }).then(function () {
                renderTable(action.dataset.entity);
                renderDashboard();
                showNotice('Record deleted.');
            }).catch(function (error) {
                showNotice(error.message);
            });
        }
        if (action.dataset.action === 'read') {
            request('toggle_enquiry', { method: 'POST', body: JSON.stringify({ id: action.dataset.id }) }).then(function () {
                renderTable('enquiries');
                renderDashboard();
            });
        }
        if (action.dataset.action === 'approve' || action.dataset.action === 'reject') {
            request('application_status', {
                method: 'POST',
                body: JSON.stringify({
                    id: action.dataset.id,
                    status: action.dataset.action === 'approve' ? 'Approved' : 'Rejected'
                })
            }).then(function () {
                renderTable('applications');
                renderDashboard();
                showNotice('Application updated.');
            }).catch(function (error) {
                showNotice(error.message);
            });
        }
    });

    modalForm.addEventListener('submit', function (event) {
        if (event.submitter && event.submitter.value !== 'save') return;
        event.preventDefault();
        var data = Object.fromEntries(new FormData(modalForm));
        request('save', { method: 'POST', body: JSON.stringify({ entity: currentEntity, id: editingId, data: data }) }).then(function () {
            modal.close();
            renderTable(currentEntity);
            renderDashboard();
            showNotice(labels[currentEntity] + ' saved successfully.');
        }).catch(function (error) {
            showNotice(error.message);
        });
    });

    document.getElementById('admin-logout').addEventListener('click', function () {
        request('logout', { method: 'POST' }).then(function () { window.location.href = 'admin.html'; });
    });

    document.getElementById('details-close').addEventListener('click', function () {
        detailsModal.close();
    });

    document.getElementById('admin-login-form').addEventListener('submit', function (event) {
        event.preventDefault();
        request('admin_login', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('admin-email').value.trim(),
                password: document.getElementById('admin-password').value
            })
        }).then(function () {
            login.hidden = true;
            dashboard.hidden = false;
            renderDashboard();
            loadProfile();
        }).catch(function (error) {
            document.getElementById('admin-login-error').textContent = error.message;
        });
    });

    document.getElementById('profile-form').addEventListener('submit', function (event) {
        event.preventDefault();
        var data = Object.fromEntries(new FormData(event.target));
        request('update_profile', { method: 'POST', body: JSON.stringify(data) }).then(function (result) {
            document.getElementById('profile-note').textContent = result.message;
        }).catch(function (error) {
            document.getElementById('profile-note').textContent = error.message;
        });
    });

    request('session').then(function (session) {
        if (session.adminLoggedIn) {
            login.hidden = true;
            dashboard.hidden = false;
            renderDashboard();
            loadProfile();
        }
    });
});
