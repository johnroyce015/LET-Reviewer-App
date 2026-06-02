var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const userCourse = session.user.user_metadata?.course || 'BSEd';
    document.body.classList.remove('hidden-body');
    
    document.getElementById('grandExamTitle').textContent = userCourse === 'BEEd' ? 'Grand LET Simulation (BEEd)' : 'Grand LET Simulation (BSEd)';

    loadPracticeTests(userCourse);
});

async function loadPracticeTests(course) {
    const container = document.getElementById('practiceTestsContainer'); 
    
    let allowedLevels = ['Both']; 
    if (course === 'BEEd') allowedLevels.push('Elementary'); 
    else allowedLevels.push('Secondary');

    const { data: categories, error } = await supabase.from('categories').select('*').in('exam_level', allowedLevels);

    if (error || !categories.length) {
        container.innerHTML = `<div class="state-loading">No practice tests available.</div>`;
        return;
    }

    container.innerHTML = ''; 

    categories.forEach(cat => {
        container.innerHTML += `
            <div class="neo-card mobile-card white-card practice-card">
                <h3 class="practice-title">${cat.category_name}</h3>
                <p class="practice-desc">Timed simulation covering ${cat.category_name} concepts.</p>
                <button class="neo-button btn-small btn-exam start-quiz-btn" data-category="${cat.category_name}">
                    Start Exam
                </button>
            </div>
        `;
    });

    // Event Delegation
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.start-quiz-btn');
        if (btn) {
            const categoryName = btn.getAttribute('data-category');
            localStorage.setItem('activeQuizCategory', categoryName);
            window.location.href = 'quiz.html';
        }
    });
}