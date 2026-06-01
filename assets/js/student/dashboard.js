var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const userName = session.user.user_metadata?.full_name || 'Student';
    const nameElement = document.getElementById('studentFirstName');
    if (nameElement) nameElement.textContent = userName.split(' ')[0];

    const userCourse = session.user.user_metadata?.course || 'BSEd'; 
    document.body.classList.remove('hidden-body');
    await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', session.user.id);

    loadAvailableQuizzes(userCourse);
});

async function loadAvailableQuizzes(course) {
    const container = document.getElementById('quizContainer'); 
    if (!container) return;
    
    container.innerHTML = '<div class="state-loading">Fetching review modules...</div>';

    let allowedLevels = ['Both']; 
    if (course === 'BEEd') allowedLevels.push('Elementary');
    else allowedLevels.push('Secondary');

    const { data: categories, error } = await supabase.from('categories').select('*').in('exam_level', allowedLevels);

    if (error) {
        container.innerHTML = `<div class="state-error">Failed to load modules: ${error.message}</div>`;
        return;
    }

    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="state-loading">No review materials available right now.</div>';
        return;
    }

    container.innerHTML = ''; 

    // HTML Injection (Cleaned)
    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'quiz-card'; 
        card.innerHTML = `
            <div class="quiz-card-info">
                <h3>${cat.category_name}</h3>
                <p><i class="fa-solid fa-layer-group"></i> ${cat.exam_level ? cat.exam_level : 'General Education'} Level</p>
            </div>
            <button class="btn-start start-quiz-btn" data-category="${cat.category_name}">
                Review <i class="fa-solid fa-arrow-right"></i>
            </button>
        `;
        container.appendChild(card);
    });

    // Event Delegation for generated buttons
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.start-quiz-btn');
        if (btn) {
            const categoryName = btn.getAttribute('data-category');
            localStorage.setItem('activeQuizCategory', categoryName);
            window.location.href = 'quiz.html';
        }
    });
}