document.addEventListener('DOMContentLoaded', function () {
    var items = {
        strength: { type: 'PROGRAM', title: 'Strength Training', image: '../assets/Strength Training photo.jpg', summary: 'Build power, stability, and confidence with progressive resistance training.', description: 'A structured strength experience for members who want measurable progress. Each session balances compound movements, good technique, and recovery.', bestFor: 'Beginners to experienced lifters', session: 'Compound lifts, accessory work, and recovery', duration: '40 to 60 minutes', equipment: 'Barbells, dumbbells, racks, and benches', benefits: ['Progressive full-body workouts', 'Technique-led coaching', 'Strength tracking over time'], exercises: [['Squats', 'Leg strength, balance, and core control'], ['Push-ups or bench press', 'Chest, shoulders, and triceps'], ['Rows', 'Back strength and posture'], ['Deadlift variations', 'Hips, hamstrings, and total-body power']] },
        cardio: { type: 'PROGRAM', title: 'Cardio Training', image: '../assets/cardio photo .jpeg', summary: 'Improve stamina and heart health with focused, energizing sessions.', description: 'Move at the right intensity for your level with a mix of steady-state and interval training that keeps your engine improving.', bestFor: 'Anyone building stamina and energy', session: 'Warm-up, work intervals, steady pace, and cooldown', duration: '20 to 45 minutes', equipment: 'Treadmills, bikes, cross-trainers, and rowing machines', benefits: ['Endurance-building sessions', 'Beginner-friendly pacing', 'Calorie-burning movement'], exercises: [['Treadmill walking or running', 'Build pace, stamina, and cardiovascular capacity'], ['Bike intervals', 'Low-impact conditioning for the legs'], ['Rowing', 'Full-body cardio with controlled power'], ['Cooldown and mobility', 'Lower intensity gradually and recover well']] },
        personal: { type: 'PROGRAM', title: 'Personal Training', image: '../assets/Personal Training photo.jpeg', summary: 'Get focused one-to-one guidance built around your goals.', description: 'Work with a coach who can refine your form, adapt exercises to your level, and keep every session purposeful.', bestFor: 'Members who want individual guidance', session: 'Assessment, coached exercises, and progress review', duration: '45 to 60 minutes', equipment: 'Selected equipment based on your goal', benefits: ['Goal-specific programming', 'One-to-one coaching', 'Form and progress feedback'], exercises: [['Movement assessment', 'Understand your starting point and priorities'], ['Goal-based strength work', 'Train the movements that matter to you'], ['Conditioning finisher', 'Build fitness without wasting time'], ['Coach review', 'Leave with a clear next step']] },
        equipment: { type: 'SERVICE', title: 'Modern Equipment', image: '../assets/Modern Gym photo.jpg', summary: 'Train with reliable, well-maintained equipment across every movement pattern.', description: 'From free weights to conditioning machines, FITNESS gives you a clean, capable environment for safe and effective training.', bestFor: 'Every training style and fitness level', session: 'Self-guided strength and conditioning', duration: 'Use the equipment for your planned session', equipment: 'Free weights, machines, racks, and cardio stations', benefits: ['Strength and cardio zones', 'Well-maintained equipment', 'Space for every training style'], exercises: [['Free-weight training', 'Dumbbells and barbells for strength'], ['Machine exercises', 'Stable resistance for focused muscle work'], ['Functional movement', 'Cables, ropes, and open training space'], ['Cardio work', 'Treadmills and machines for conditioning']] },
        trainers: { type: 'SERVICE', title: 'Expert Trainers', image: '../assets/Personal Training photo.jpeg', summary: 'Train with people who keep your technique and progress in focus.', description: 'Our trainers bring structure, encouragement, and practical expertise to help you stay consistent and make better decisions in the gym.', bestFor: 'Members who value support and accountability', session: 'Coaching, form checks, and progress reviews', duration: 'Support available throughout your gym routine', equipment: 'Training tools selected for your program', benefits: ['Certified coaching support', 'Practical exercise guidance', 'Accountability that lasts'], exercises: [['Form coaching', 'Learn safer and more effective technique'], ['Program guidance', 'Know what to do when you enter the gym'], ['Progress checks', 'Adjust training as your fitness changes'], ['Motivation and accountability', 'Stay consistent through real support']] },
        hours: { type: 'SERVICE', title: 'Flexible Hours', image: '../assets/fitness classis photo.jpeg', summary: 'Choose a training time that fits your real schedule.', description: 'Consistency becomes easier when your gym routine can flex around work, study, family, and the rest of your life.', bestFor: 'Busy members with changing schedules', session: 'Flexible gym access around your routine', duration: 'Choose a time that you can repeat consistently', equipment: 'Full gym access during operating hours', benefits: ['More scheduling flexibility', 'Less friction in your routine', 'A rhythm you can maintain'], exercises: [['Morning training', 'Start your day with focused movement'], ['Midday sessions', 'Reset your energy between commitments'], ['Evening workouts', 'Train after work or study'], ['Flexible weekly planning', 'Build consistency without rigid timing']] }
    };
    var key = new URLSearchParams(window.location.search).get('item');
    var item = items[key] || items.strength;
    document.title = 'FITNESS | ' + item.title;
    document.getElementById('details-image').src = item.image;
    document.getElementById('details-image').alt = item.title;
    document.getElementById('details-type').textContent = item.type;
    document.getElementById('details-title').textContent = item.title;
    document.getElementById('details-summary').textContent = item.summary;
    document.getElementById('details-description').textContent = item.description;
    document.getElementById('details-best-for').textContent = item.bestFor;
    document.getElementById('details-session').textContent = item.session;
    document.getElementById('details-duration').textContent = item.duration;
    document.getElementById('details-equipment').textContent = item.equipment;
    document.getElementById('details-ai-title').textContent = item.title;
    document.getElementById('details-benefits').innerHTML = item.benefits.map(function (benefit) { return '<li><i class="bi bi-check2"></i>' + benefit + '</li>'; }).join('');
    document.getElementById('details-exercises').innerHTML = item.exercises.map(function (exercise, index) { return '<article><span>0' + (index + 1) + '</span><div><h3>' + exercise[0] + '</h3><p>' + exercise[1] + '</p></div></article>'; }).join('');

    document.getElementById('details-ai-form').addEventListener('submit', function (event) {
        event.preventDefault();
        var input = document.getElementById('details-ai-question');
        var answer = document.getElementById('details-ai-answer');
        var question = input.value.trim();
        if (!question) return;
        answer.innerHTML = '<i class="bi bi-hourglass-split"></i><span>Thinking about ' + item.title + '...</span>';
        fetch('../../backend/api.php?action=ai_chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question, context: item.title + ' (' + item.type + '). Best for: ' + item.bestFor + '. Session style: ' + item.session + '. Details: ' + item.description }) }).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) throw new Error(data.message || 'AI Coach is unavailable.');
                answer.innerHTML = '<i class="bi bi-stars"></i><span></span>';
                answer.querySelector('span').textContent = data.answer;
            });
        }).catch(function (error) {
            answer.innerHTML = '<i class="bi bi-info-circle"></i><span>' + error.message + ' You can still use the information above.</span>';
        });
        input.value = '';
    });
});