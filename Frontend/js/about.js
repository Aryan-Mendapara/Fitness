document.addEventListener('DOMContentLoaded', function () {
    var profiles = {
        kirtan: { name: 'Kirtan Sheladiya', role: 'Founder · Community and growth', image: '/Frontend/assets/kirtan photo.jpeg', story: 'Kirtan shaped FITNESS around the idea that a gym should feel welcoming, focused, and built for long-term progress. His work centers on creating a holistic fitness community where every member can find a clear next step.' },
        aryan: { name: 'Aryan Mendapara', role: 'Founder · Training and wellness', image: '/Frontend/assets/ARYAN PHOTO.jpeg', story: 'Aryan brings a training and nutrition mindset to the FITNESS experience. He is passionate about making coaching practical, approachable, and useful for people at every stage of their fitness journey.' },
        prince: { name: 'Prince Sojitra', role: 'Founder · Member experience', image: '/Frontend/assets/prince photo.jpeg', story: 'Prince helps shape the everyday experience at FITNESS, from the energy of the space to the consistency of the member journey. His focus is building a gym people are excited to return to.' }
    };
    var modal = document.getElementById('founder-modal');
    document.querySelectorAll('[data-founder]').forEach(function (button) {
        button.addEventListener('click', function () {
            var profile = profiles[button.dataset.founder];
            document.getElementById('founder-modal-image').src = profile.image;
            document.getElementById('founder-modal-image').alt = profile.name;
            document.getElementById('founder-modal-name').textContent = profile.name;
            document.getElementById('founder-modal-role').textContent = profile.role;
            document.getElementById('founder-modal-story').textContent = profile.story;
            modal.showModal();
        });
    });
    function closeModal() {
        if (modal.open) modal.close();
        modal.removeAttribute('open');
    }

    document.getElementById('founder-modal-close').addEventListener('click', function (event) {
        event.preventDefault();
        closeModal();
    });

    modal.addEventListener('click', function (event) {
        if (event.target === modal) closeModal();
    });

    modal.addEventListener('cancel', function (event) {
        event.preventDefault();
        closeModal();
    });

    window.addEventListener('pageshow', function () {
        closeModal();
    });
});