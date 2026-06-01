var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const userCourse = session.user.user_metadata?.course || 'BSEd';
    document.body.classList.remove('hidden-body');

    loadReviewModules(userCourse);
});

async function loadReviewModules(course) {
    const container = document.getElementById('reviewModulesContainer'); 
    
    let allowedLevels = ['Both']; 
    if (course === 'BEEd') allowedLevels.push('Elementary');
    else allowedLevels.push('Secondary');

    const { data: categories, error } = await supabase.from('categories').select('*').in('exam_level', allowedLevels);

    if (error || !categories.length) {
        container.innerHTML = `<div class="state-error">No modules found.</div>`;
        return;
    }

    container.innerHTML = ''; 
    const colors = ['purple-card', 'yellow-card', 'green-card'];

    categories.forEach((cat, index) => {
        const colorClass = colors[index % colors.length];
        container.innerHTML += `
            <div class="neo-card mobile-card ${colorClass} module-card">
                <span class="mastery-pill pill-white">${cat.exam_level.toUpperCase()} LEVEL</span>
                <h3 class="module-title">${cat.category_name}</h3>
                <p class="module-desc">Targeted practice materials for ${cat.category_name}.</p>
                <div class="module-actions">
                    <button class="neo-button btn-small btn-practice start-quiz-btn" data-category="${cat.category_name}">
                        <i class="fa-solid fa-pen-to-square"></i> Practice
                    </button>
                </div>
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