var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {

    const { data: { session }, error: sessionError } =
        await supabase.auth.getSession();

    if (sessionError || !session) {
        window.location.href = '../login.html';
        return;
    }

    const userName =
        session.user.user_metadata?.full_name || 'Student';

    const nameElement =
        document.getElementById('studentFirstName');

    if (nameElement) {
        nameElement.textContent =
            userName.split(' ')[0];
    }

    const userCourse =
        session.user.user_metadata?.course || 'BSEd';

    document.body.classList.remove('hidden-body');

    // Update activity timestamp
    await supabase
        .from('profiles')
        .update({
            last_active_at:
                new Date().toISOString()
        })
        .eq('id', session.user.id);

    // NEW:
    // Download all available question banks
    // for offline usage
    await preloadQuestions();

    loadAvailableQuizzes(userCourse);
});


// ==========================================
// PRELOAD QUESTIONS FOR OFFLINE MODE
// ==========================================
async function preloadQuestions() {

    try {

        if (!navigator.onLine) {
            console.log(
                '📴 Offline mode detected. Using cached questions.'
            );
            return;
        }

        if (
            !window.OfflineSync ||
            !window.OfflineSync.syncQuestions
        ) {
            console.warn(
                '⚠️ OfflineSync not loaded.'
            );
            return;
        }

        console.log(
            '🟢 Downloading question banks for offline access...'
        );

        const { data: categories, error } =
            await supabase
                .from('categories')
                .select('category_name');

        if (error) {
            console.error(
                '❌ Failed to load categories:',
                error.message
            );
            return;
        }

        if (!categories || !categories.length) {
            return;
        }

        for (const category of categories) {

            await window.OfflineSync
                .syncQuestions(
                    category.category_name
                );

            console.log(
                `✅ Cached: ${category.category_name}`
            );
        }

        console.log(
            '🎉 Offline question download complete.'
        );

    } catch (err) {

        console.error(
            '❌ Question preload failed:',
            err
        );
    }
}


// ==========================================
// LOAD AVAILABLE QUIZZES (UPDATED NEO-BRUTALIST DESIGN)
// ==========================================
async function loadAvailableQuizzes(course) {

    const container = document.getElementById('quizContainer');
    if (!container) return;

    container.innerHTML = '<div class="state-loading" style="padding: 20px; text-align: center; font-weight: bold; color: #4B5563;">Fetching review modules...</div>';

    let allowedLevels = ['Both'];
    if (course === 'BEEd') {
        allowedLevels.push('Elementary');
    } else {
        allowedLevels.push('Secondary');
    }

    const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .in('exam_level', allowedLevels);

    if (error) {
        container.innerHTML = `<div class="state-error">Failed to load modules: ${error.message}</div>`;
        return;
    }

    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="state-loading" style="padding: 20px; text-align: center; font-weight: bold; color: #4B5563;">No review materials available right now.</div>';
        return;
    }

    // Clear the loading message (and the hardcoded HTML)
    container.innerHTML = '';
    
    // Ensure the container has the correct class for the new flex layout
    container.className = 'subject-areas-list';

    // The new design themes matching your CSS
    const themes = [
        { bgClass: 'yellow-card', icon: 'fa-earth-americas' },
        { bgClass: 'green-card', icon: 'fa-graduation-cap' },
        { bgClass: 'purple-card', icon: 'fa-book-bookmark' },
        { bgClass: 'pink-bg', icon: 'fa-shapes' } // Fallback for a 4th category
    ];

    categories.forEach((cat, index) => {
        const theme = themes[index % themes.length];
        const card = document.createElement('div');
        
        // Apply the new design classes AND your 'start-quiz-btn' class so your click script works
        card.className = `subject-card ${theme.bgClass} start-quiz-btn`;
        card.setAttribute('data-category', cat.category_name);

        card.innerHTML = `
            <div class="subject-icon-box"><i class="fa-solid ${theme.icon}"></i></div>
            <span class="subject-name">${cat.category_name}</span>
        `;

        container.appendChild(card);
    });

    // Attach the click listener exactly like you had it
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.start-quiz-btn');
        if (!btn) return;

        const categoryName = btn.getAttribute('data-category');
        localStorage.setItem('activeQuizCategory', categoryName);
        window.location.href = 'quiz.html';
    });
}