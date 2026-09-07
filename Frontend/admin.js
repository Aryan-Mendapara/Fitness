document.addEventListener('DOMContentLoaded', function () {
    var login = document.getElementById('admin-login');
    var dashboard = document.getElementById('admin-dashboard');
    var modal = document.getElementById('admin-modal');
    var modalForm = document.getElementById('entity-form');
    var modalFields = document.getElementById('modal-fields');
    var currentEntity = '';
    var editingId = null;
    var seed = {
        members: [{ id: 1, name: 'Rahul Patel', email: 'rahul@example.com', phone: '+91 98765 43210', plan: 'Premium', status: 'Active', joined: '2026-09-07' }, { id: 2, name: 'Priya Shah', email: 'priya@example.com', phone: '+91 98765 11111', plan: 'Standard', status: 'Active', joined: '2026-09-06' }, { id: 3, name: 'Jay Mehta', email: 'jay@example.com', phone: '+91 98765 22222', plan: 'Basic', status: 'Expired', joined: '2026-08-15' }],
        plans: [{ id: 1, name: 'Basic', price: '999', duration: '1 Month', description: 'Gym access and locker.' }, { id: 2, name: 'Standard', price: '2499', duration: '3 Months', description: 'Gym access and group classes.' }, { id: 3, name: 'Premium', price: '7999', duration: '12 Months', description: 'All access with personal training.' }],
        trainers: [{ id: 1, name: 'Arjun Kapoor', photo: '', specialization: 'Strength Training', experience: '8 years', contact: '+91 98765 44444' }, { id: 2, name: 'Neha Patel', photo: '', specialization: 'Yoga & Mobility', experience: '5 years', contact: '+91 98765 55555' }],
        services: [{ id: 1, name: 'Personal Training', description: 'One-on-one coaching with certified trainers.', status: 'Active' }, { id: 2, name: 'Cardio', description: 'Improve endurance with modern cardio equipment.', status: 'Active' }, { id: 3, name: 'Weight Training', description: 'Build strength with guided weight training.', status: 'Active' }, { id: 4, name: 'Yoga', description: 'Balance strength, mobility and recovery.', status: 'Active' }],
        facilities: [{ id: 1, name: 'Gym Equipment', image: '', description: 'Modern strength and cardio equipment.' }, { id: 2, name: 'Locker', image: '', description: 'Secure lockers for every member.' }, { id: 3, name: 'Shower', image: '', description: 'Clean shower and changing facilities.' }, { id: 4, name: 'Parking', image: '', description: 'Convenient parking for members.' }],
        enquiries: [{ id: 1, name: 'Karan Joshi', email: 'karan@example.com', phone: '+91 98765 77777', message: 'I would like to know about the Premium plan.', read: false }, { id: 2, name: 'Mira Shah', email: 'mira@example.com', phone: '+91 98765 88888', message: 'Can I book a trial session?', read: true }],
        payments: [{ id: 1, member: 'Rahul Patel', plan: 'Premium', amount: '7999', status: 'Paid', date: '2026-09-07' }, { id: 2, member: 'Priya Shah', plan: 'Standard', amount: '2499', status: 'Paid', date: '2026-09-06' }]
    };
    var fields = {
        members: [['name', 'Member Name'], ['email', 'Email', 'email'], ['phone', 'Phone'], ['plan', 'Plan'], ['status', 'Membership Status', 'select', ['Active', 'Expired', 'Pending']], ['joined', 'Joined Date', 'date']],
        plans: [['name', 'Plan Name'], ['price', 'Price'], ['duration', 'Duration'], ['description', 'Description', 'textarea']],
        trainers: [['name', 'Trainer Name'], ['photo', 'Profile Photo URL'], ['specialization', 'Specialization'], ['experience', 'Experience'], ['contact', 'Contact Details']],
        services: [['name', 'Service Name'], ['description', 'Description', 'textarea'], ['status', 'Status', 'select', ['Active', 'Inactive']]],
        facilities: [['name', 'Facility Name'], ['image', 'Facility Image URL'], ['description', 'Description', 'textarea']],
        payments: [['member', 'Member Name'], ['plan', 'Plan'], ['amount', 'Amount'], ['status', 'Payment Status', 'select', ['Paid', 'Pending', 'Failed']], ['date', 'Payment Date', 'date']]
    };
    var labels = { members: 'Member', plans: 'Plan', trainers: 'Trainer', services: 'Service', facilities: 'Facility', payments: 'Payment' };

    function readData(entity) {
        var stored = localStorage.getItem('fitness_' + entity);
        if (stored) return JSON.parse(stored);
        localStorage.setItem('fitness_' + entity, JSON.stringify(seed[entity] || []));
        return seed[entity] || [];
    }

    function saveData(entity, data) {
        localStorage.setItem('fitness_' + entity, JSON.stringify(data));
    }

    function escapeHTML(value) {
        return String(value || '').replace(/[&<>'"]/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]; });
    }

    function showNotice(message) {
        var note = document.getElementById('admin-note');
        note.textContent = message;
        window.setTimeout(function () { note.textContent = ''; }, 3000);
    }

    function showSection(section) {
        document.querySelectorAll('.admin-nav-item').forEach(function (item) { item.classList.toggle('is-active', item.dataset.section === section); });
        document.querySelectorAll('.admin-view').forEach(function (view) { view.classList.toggle('is-visible', view.dataset.view === section); });
        document.getElementById('section-title').textContent = section === 'dashboard' ? 'Dashboard' : document.querySelector('[data-section="' + section + '"]').textContent;
        if (section !== 'dashboard') renderTable(section);
    }

    function renderTable(entity) {
        var data = readData(entity);
        var target = document.getElementById(entity + '-table');
        if (entity === 'enquiries') {
            target.innerHTML = data.length ? '<table><thead><tr><th>Name</th><th>Contact</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + data.map(function (item) { return '<tr class="' + (item.read ? '' : 'row-unread') + '"><td><strong>' + escapeHTML(item.name) + '</strong></td><td>' + escapeHTML(item.email) + '<small>' + escapeHTML(item.phone) + '</small></td><td>' + escapeHTML(item.message) + '</td><td><span class="status ' + (item.read ? 'status--active' : 'status--pending') + '">' + (item.read ? 'Read' : 'New') + '</span></td><td><button class="table-action" data-action="read" data-entity="enquiries" data-id="' + item.id + '">' + (item.read ? 'Unread' : 'Read') + '</button><button class="table-action table-delete" data-action="delete" data-entity="enquiries" data-id="' + item.id + '">Delete</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="admin-empty">No enquiries yet.</p>';
            return;
        }
        var columns = Object.keys(data[0] || {}).filter(function (key) { return key !== 'id' && key !== 'description' && key !== 'image' && key !== 'photo'; });
        target.innerHTML = data.length ? '<table><thead><tr>' + columns.map(function (key) { return '<th>' + key.replace(/^[a-z]/, function (letter) { return letter.toUpperCase(); }) + '</th>'; }).join('') + '<th>Actions</th></tr></thead><tbody>' + data.map(function (item) { return '<tr>' + columns.map(function (key) { return '<td>' + (key === 'status' ? '<span class="status ' + (item[key] === 'Active' || item[key] === 'Paid' ? 'status--active' : 'status--pending') + '">' + escapeHTML(item[key]) + '</span>' : escapeHTML(item[key])) + '</td>'; }).join('') + '<td><button class="table-action" data-action="edit" data-entity="' + entity + '" data-id="' + item.id + '">Edit</button><button class="table-action table-delete" data-action="delete" data-entity="' + entity + '" data-id="' + item.id + '">Delete</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="admin-empty">No records yet. Add the first one.</p>';
    }

    function renderDashboard() {
        var members = readData('members');
        var trainers = readData('trainers');
        var enquiries = readData('enquiries');
        document.querySelector('[data-stat="members"]').textContent = members.length;
        document.querySelector('[data-stat="active"]').textContent = members.filter(function (item) { return item.status === 'Active'; }).length;
        document.querySelector('[data-stat="expired"]').textContent = members.filter(function (item) { return item.status === 'Expired'; }).length;
        document.querySelector('[data-stat="trainers"]').textContent = trainers.length;
        document.querySelector('[data-stat="enquiries"]').textContent = enquiries.filter(function (item) { return !item.read; }).length;
        document.querySelector('[data-stat="recent"]').textContent = members.filter(function (item) { return item.joined >= '2026-08-08'; }).length;
        document.getElementById('recent-members').innerHTML = members.slice(-4).reverse().map(function (item) { return '<div class="recent-member"><span><strong>' + escapeHTML(item.name) + '</strong><small>' + escapeHTML(item.email) + '</small></span><span class="status ' + (item.status === 'Active' ? 'status--active' : 'status--pending') + '">' + escapeHTML(item.status) + '</span></div>'; }).join('') || '<p class="admin-empty">No members yet.</p>';
    }

    function openModal(entity, id) {
        currentEntity = entity;
        editingId = id || null;
        var item = id ? readData(entity).find(function (record) { return record.id === id; }) : {};
        document.getElementById('modal-title').textContent = (id ? 'Edit ' : 'Add ') + labels[entity];
        modalFields.innerHTML = fields[entity].map(function (field) {
            var type = field[2] || 'text';
            var value = escapeHTML(item[field[0]] || '');
            if (type === 'select') return '<label>' + field[1] + '<select name="' + field[0] + '">' + field[3].map(function (option) { return '<option ' + (option === item[field[0]] ? 'selected' : '') + '>' + option + '</option>'; }).join('') + '</select></label>';
            if (type === 'textarea') return '<label>' + field[1] + '<textarea name="' + field[0] + '" required>' + value + '</textarea></label>';
            return '<label>' + field[1] + '<input type="' + type + '" name="' + field[0] + '" value="' + value + '" required></label>';
        }).join('');
        modal.showModal();
    }

    function deleteRecord(entity, id) {
        if (!window.confirm('Delete this ' + labels[entity].toLowerCase() + '?')) return;
        saveData(entity, readData(entity).filter(function (item) { return item.id !== id; }));
        renderTable(entity); renderDashboard(); showNotice('Record deleted.');
    }

    document.querySelectorAll('.admin-nav-item').forEach(function (button) { button.addEventListener('click', function () { showSection(button.dataset.section); }); });
    document.querySelectorAll('[data-go]').forEach(function (button) { button.addEventListener('click', function () { showSection(button.dataset.go); }); });
    document.querySelectorAll('.admin-add').forEach(function (button) { button.addEventListener('click', function () { openModal(button.dataset.entity); }); });
    document.addEventListener('click', function (event) {
        var action = event.target.closest('[data-action]');
        if (!action) return;
        var entity = action.dataset.entity; var id = Number(action.dataset.id);
        if (action.dataset.action === 'delete') deleteRecord(entity, id);
        if (action.dataset.action === 'edit') openModal(entity, id);
        if (action.dataset.action === 'read') { var data = readData(entity); var record = data.find(function (item) { return item.id === id; }); record.read = !record.read; saveData(entity, data); renderTable(entity); renderDashboard(); }
    });
    modalForm.addEventListener('submit', function (event) {
        if (event.submitter && event.submitter.value !== 'save') return;
        event.preventDefault();
        var formData = new FormData(modalForm); var record = {};
        formData.forEach(function (value, key) { record[key] = value; });
        var data = readData(currentEntity);
        if (editingId) { record.id = editingId; data = data.map(function (item) { return item.id === editingId ? record : item; }); } else { record.id = Date.now(); data.push(record); }
        saveData(currentEntity, data); modal.close(); renderTable(currentEntity); renderDashboard(); showNotice(labels[currentEntity] + ' saved successfully.');
    });
    var profileForm = document.getElementById('profile-form');
    var savedProfile = JSON.parse(localStorage.getItem('fitness_admin_profile') || '{"name":"Fitness Admin","email":"admin@fitness.com"}');
    profileForm.elements.name.value = savedProfile.name;
    profileForm.elements.email.value = savedProfile.email;
    profileForm.addEventListener('submit', function (event) { event.preventDefault(); var data = Object.fromEntries(new FormData(event.target)); var newPassword = data.password; delete data.password; localStorage.setItem('fitness_admin_profile', JSON.stringify(data)); if (newPassword) localStorage.setItem('fitness_admin_password', newPassword); profileForm.elements.password.value = ''; document.getElementById('profile-note').textContent = 'Profile and password saved successfully.'; });
    document.getElementById('admin-logout').addEventListener('click', function () { localStorage.removeItem('fitnessAdminLoggedIn'); localStorage.removeItem('fitnessLoggedIn'); window.location.href = 'admin.html'; });
    document.getElementById('admin-login-form').addEventListener('submit', function (event) { event.preventDefault(); var email = document.getElementById('admin-email').value.trim().toLowerCase(); var password = document.getElementById('admin-password').value; var adminPassword = localStorage.getItem('fitness_admin_password') || 'admin123'; if (email === savedProfile.email.toLowerCase() && password === adminPassword) { localStorage.setItem('fitnessAdminLoggedIn', 'true'); localStorage.setItem('fitnessLoggedIn', 'true'); window.location.href = 'index.html'; } else document.getElementById('admin-login-error').textContent = 'Invalid admin email or password.'; });

    var isAdmin = localStorage.getItem('fitnessAdminLoggedIn') === 'true';
    if (isAdmin) { login.hidden = true; dashboard.hidden = false; Object.keys(seed).forEach(readData); renderDashboard(); }
});
