var supabase = null;

document.addEventListener('DOMContentLoaded', async () => {
    supabase = window.supabaseClient;
    if (!supabase) return;

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const userName = session.user.user_metadata?.full_name || 'Student';
    const nameElement = document.getElementById('studentFirstName');
    if (nameElement) nameElement.textContent = userName.split(' ')[0];

    const userCourse = session.user.user_metadata?.course || 'BSEd'; 
    document.body.classList.remove('hidden-body');
    await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', session.user.id);

    loadAvailableQuizzes(userCourse);
    setupDashboardResumeQuiz();
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

    // Dynamic brand palette mapping arrays
    const colors = ['#C4B5FD', '#FDE68A', '#6EE7B7', '#FCA5A5'];
    const icons = ['📐', '✍️', '🌍', '🔬', '💻'];

    categories.forEach((cat, index) => {
        const cardColor = colors[index % colors.length];
        const cardIcon = icons[index % icons.length];

        const card = document.createElement('div');
        card.className = 'mobile-card white-card subject-card'; 
        // 🔥 PLATFORM VISUAL FIX: Inline styling guarantees premium grid control structures
        card.style.cssText = 'border: 2px solid #111827; display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 12px; box-shadow: 4px 4px 0px #111827; border-radius: 12px; background: #fff; text-align: left;';
        
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
                <div class="subject-icon" style="font-size: 20px; background: #fff; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border: 2px solid #111827; border-radius: 8px; flex-shrink: 0; box-shadow: 1px 1px 0px #111827;">
                    ${cardIcon}
                </div>
                <div>
                    <h4 style="margin:0; font-size: 16px; font-weight: 900; color: #111827;">Major: ${cat.category_name}</h4>
                    <div style="font-size: 12px; color: #4B5563; font-weight: 700; margin-top: 2px;">
                        📚 ${cat.exam_level} Level
                    </div>
                </div>
            </div>
            <button class="btn-start start-quiz-btn" data-category="${cat.category_name}" style="background: ${cardColor}; color: #111827; border: 2px solid #111827; padding: 8px 14px; border-radius: 8px; font-weight: 900; font-size: 12px; cursor: pointer; box-shadow: 2px 2px 0px #111827; margin: 0; white-space: nowrap;">
                Review ➡️
            </button>
        `;
        container.appendChild(card);
    });

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.start-quiz-btn');
        if (btn) {
            const categoryName = btn.getAttribute('data-category');
            localStorage.setItem('activeQuizCategory', categoryName);
            window.location.href = 'quiz.html';
        }
    });

    calculateOverallReadiness();
}

// 🔄 MID-SESSION RESUME DETECTION MECHANICS
function setupDashboardResumeQuiz() {
    const savedState = localStorage.getItem('activeQuizState');
    const resumeCard = document.querySelector('.resume-card');
    const resumeBtn = document.querySelector('.btn-resume');

    if (!resumeCard || !resumeBtn) return;

    if (savedState) {
        try {
            const stateData = JSON.parse(savedState);
            if (!stateData?.category || !Array.isArray(stateData?.currentQuestions)) throw new Error("Incomplete tracking parameters.");

            document.querySelector('.resume-title').textContent = `${stateData.category} Review Session`;
            document.querySelector('.resume-meta').textContent = `Question ${stateData.currentIndex + 1} of ${stateData.currentQuestions.length} • Progress Saved`;
            
            resumeBtn.disabled = false;
            resumeBtn.style.background = '';
            resumeBtn.style.opacity = '1';
            resumeBtn.style.cursor = 'pointer';
            resumeBtn.innerHTML = 'Continue Quiz <i class="fa-solid fa-arrow-right"></i>';
            
            resumeBtn.onclick = (e) => {
                e.preventDefault();
                localStorage.setItem('activeQuizCategory', stateData.category);
                localStorage.setItem('resumeQuizMode', 'true'); 
                window.location.href = 'quiz.html';
            };
        } catch (err) {
            localStorage.removeItem('activeQuizState');
            setResumeCardDisabledState(resumeBtn);
        }
    } else {
        setResumeCardDisabledState(resumeBtn);
    }
}

function setResumeCardDisabledState(btn) {
    document.querySelector('.resume-title').textContent = "No Active Session Found";
    document.querySelector('.resume-meta').textContent = "Pick a subject module block below to start fresh.";
    if (btn) {
        btn.style.background = '#9CA3AF';
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.innerHTML = 'No Quiz In Progress <i class="fa-solid fa-ban"></i>';
        btn.onclick = (e) => e.preventDefault();
    }
}

async function calculateOverallReadiness() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: logs } = await supabase.from('exam_results').select('percentage').eq('student_email', session.user.email);
        
        if (logs && logs.length > 0) {
            const sum = logs.reduce((acc, curr) => acc + curr.percentage, 0);
            const avg = Math.round(sum / logs.length);
            
            document.getElementById('overallReadinessDisplay').textContent = `${avg}%`;
            document.getElementById('readinessCountFraction').textContent = `${logs.length} Exams Logged`;
            document.getElementById('readinessProgressBar').style.width = `${avg}%`;
            
            const pill = document.getElementById('readinessStatusPill');
            if (avg >= 75) {
                pill.textContent = "Good Standing";
                pill.style.background = "#6EE7B7";
            } else {
                pill.textContent = "Needs Review";
                pill.style.background = "#FCA5A5";
            }
        }
    } catch(err) { console.warn(err); }
}