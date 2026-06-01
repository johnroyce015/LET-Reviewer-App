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
// LOAD AVAILABLE QUIZZES
// ==========================================
async function loadAvailableQuizzes(course) {

    const container =
        document.getElementById('quizContainer');

    if (!container) return;

    container.innerHTML =
        '<div class="state-loading">Fetching review modules...</div>';

    let allowedLevels = ['Both'];

    if (course === 'BEEd') {
        allowedLevels.push('Elementary');
    } else {
        allowedLevels.push('Secondary');
    }

    const { data: categories, error } =
        await supabase
            .from('categories')
            .select('*')
            .in('exam_level', allowedLevels);

    if (error) {

        container.innerHTML =
            `<div class="state-error">
                Failed to load modules:
                ${error.message}
            </div>`;

        return;
    }

    if (!categories || categories.length === 0) {

        container.innerHTML =
            '<div class="state-loading">No review materials available right now.</div>';

        return;
    }

    container.innerHTML = '';

    const colors = [
        '#C4B5FD',
        '#FDE68A',
        '#6EE7B7',
        '#FCA5A5'
    ];

    const icons = [
        '📐',
        '✍️',
        '🌍',
        '🔬',
        '💻'
    ];

    categories.forEach((cat, index) => {

        const cardColor =
            colors[index % colors.length];

        const cardIcon =
            icons[index % icons.length];

        const card =
            document.createElement('div');

        card.className =
            'mobile-card white-card subject-card';

        card.style.cssText =
            'border: 2px solid #111827; display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 12px; box-shadow: 4px 4px 0px #111827; border-radius: 12px;';

        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:15px;flex-grow:1;">
                
                <div class="subject-icon"
                     style="
                        font-size:20px;
                        background:#fff;
                        width:40px;
                        height:40px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        border:2px solid #111827;
                        border-radius:8px;">
                    ${cardIcon}
                </div>

                <div>
                    <h4 style="
                        margin:0;
                        font-size:16px;
                        font-weight:900;
                        color:#111827;">
                        ${cat.category_name}
                    </h4>

                    <div style="
                        font-size:12px;
                        color:#4B5563;
                        font-weight:700;
                        margin-top:2px;">
                        <i class="fa-solid fa-layer-group"></i>
                        ${cat.exam_level
                            ? cat.exam_level
                            : 'General Education'}
                        Level
                    </div>
                </div>
            </div>

            <button
                class="start-quiz-btn"
                data-category="${cat.category_name}"
                style="
                    background:${cardColor};
                    color:#111827;
                    border:2px solid #111827;
                    padding:8px 14px;
                    border-radius:8px;
                    font-weight:900;
                    font-size:12px;
                    cursor:pointer;
                    box-shadow:2px 2px 0px #111827;
                    margin:0;
                    white-space:nowrap;">
                Review ➡️
            </button>
        `;

        container.appendChild(card);
    });

    container.addEventListener('click', (e) => {

        const btn =
            e.target.closest('.start-quiz-btn');

        if (!btn) return;

        const categoryName =
            btn.getAttribute('data-category');

        localStorage.setItem(
            'activeQuizCategory',
            categoryName
        );

        window.location.href =
            'quiz.html';
    });
}