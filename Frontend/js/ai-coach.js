document.addEventListener('DOMContentLoaded', function () {
    var messages = document.getElementById('ai-messages');
    var goal = document.getElementById('ai-goal');
    var level = document.getElementById('ai-level');
    var time = document.getElementById('ai-time');
    var prompt = document.getElementById('ai-prompt');
    var question = document.getElementById('ai-question');
    var statusText = document.getElementById('ai-status-text');
    var statusDot = document.getElementById('ai-status-dot');
    var plans = {
        strength: { title: 'Strength foundation', focus: 'controlled reps and full-body tension', moves: ['Goblet squat', 'Push-ups', 'Single-arm row', 'Romanian deadlift'] },
        'fat-loss': { title: 'Metabolic lift', focus: 'steady effort with short, intentional rests', moves: ['Reverse lunge', 'Kettlebell swing', 'Mountain climber', 'Farmer carry'] },
        endurance: { title: 'Engine builder', focus: 'smooth pacing you can sustain', moves: ['Incline walk', 'Bike intervals', 'Step-ups', 'Easy cooldown jog'] },
        mobility: { title: 'Mobility reset', focus: 'slow range of motion and relaxed breathing', moves: ["World's greatest stretch", '90/90 switches', 'Thoracic rotations', 'Deep squat hold'] }
    };

    function addMessage(text, type, markup) {
        var message = document.createElement('div');
        message.className = 'ai-message ai-message--' + type;
        if (type === 'coach') {
            message.innerHTML = '<span class="ai-message-icon"><i class="bi bi-stars"></i></span><p></p>';
            if (markup) message.querySelector('p').innerHTML = text;
            else message.querySelector('p').textContent = text;
        } else {
            message.textContent = text;
        }
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }

    function buildPlan() {
        var plan = plans[goal.value];
        var minutes = Number(time.value);
        var rounds = level.value === 'advanced' ? 4 : level.value === 'intermediate' ? 3 : 2;
        var work = Math.max(3, Math.floor((minutes - 7) / (rounds * 2)));
        var list = plan.moves.map(function (move, index) { return '<li><span>0' + (index + 1) + '</span><strong>' + move + '</strong><small>' + work + ' min focused work</small></li>'; }).join('');
        addMessage('<strong>' + plan.title + '</strong><br>Today is about ' + plan.focus + '. Complete ' + rounds + ' rounds, rest 60 seconds between rounds, and stop if your form breaks down.<ol class="ai-plan-list">' + list + '</ol><small class="ai-disclaimer">Adjust intensity to your experience and consult a professional for medical concerns.</small>', 'coach', true);
    }

    function setAiStatus(online) {
        statusText.textContent = online ? 'Local AI online' : 'Offline guidance mode';
        statusDot.style.background = online ? '#72d69b' : '#f9ac54';
    }

    fetch('../../backend/api.php?action=ai_chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Reply with OK', context: 'Connection check. Keep the answer short.' })
    }).then(function (response) {
        setAiStatus(response.ok);
    }).catch(function () {
        setAiStatus(false);
    });

    document.getElementById('ai-generate').addEventListener('click', buildPlan);
    document.getElementById('ai-reset').addEventListener('click', function () {
        messages.innerHTML = '<div class="ai-message ai-message--coach"><span class="ai-message-icon"><i class="bi bi-stars"></i></span><p>Tell me what you want to work on today. I will turn it into a clear, realistic session.</p></div>';
    });
    prompt.addEventListener('submit', function (event) {
        event.preventDefault();
        var text = question.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        question.value = '';
        var context = 'Goal: ' + goal.options[goal.selectedIndex].text + '; Level: ' + level.options[level.selectedIndex].text + '; Time: ' + time.value + ' minutes.';
        fetch('../../backend/api.php?action=ai_chat', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, context: context })
        }).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) throw new Error(data.message || 'Local AI unavailable');
                addMessage(data.answer, 'coach');
            });
        }).catch(function () {
            setAiStatus(false);
            var reply = /warm|stretch|mobility/i.test(text) ? 'Start with five minutes of easy movement, then use the Mobility Reset plan. Never force a painful range.' : /food|eat|protein|diet/i.test(text) ? 'Build meals around protein, colorful plants, water, and a portion that supports your goal.' : /begin|new|start/i.test(text) ? 'Choose Beginner, 20 minutes, and Build my session. Keep every rep smooth and leave a few reps in reserve.' : 'Start with your selected goal and time. Build the session, then tell me what felt easy or difficult so we can adjust next time.';
            addMessage(reply, 'coach');
        });
    });
});