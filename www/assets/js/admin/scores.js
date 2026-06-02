var supabase = window.supabaseClient;
let allScores = []; 
let currentFilteredScores = []; 
let scoreDisplayLimit = 50;

document.addEventListener('DOMContentLoaded', async () => {

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    const userRole = profileData && profileData.role ? profileData.role.toLowerCase() : 'student';

    if (userRole !== 'teacher' && userRole !== 'admin') {
        window.location.href = '../login.html'; return;
    }
    document.body.style.visibility = 'visible';

    // Attach Filter Events
    document.getElementById('searchScoreInput').addEventListener('input', filterScores);
    document.getElementById('scoreCategoryFilter').addEventListener('change', filterScores);

    const refreshBtn = document.getElementById('refreshScoresBtn');
    if(refreshBtn) {
        refreshBtn.addEventListener('click', fetchScores);
    }

    fetchScores();
});

async function fetchScores() {
    const container = document.getElementById('scoresContainer');
    container.innerHTML = '<div class="loading-state">Fetching latest results...</div>';

    try {
        const { data, error } = await supabase
            .from('exam_results')
            .select('student_name, category, score, total_questions, percentage, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading-state">No exam results synced yet.</div>';
            return;
        }

        allScores = data;
        populateScoreCategoryDropdown();
        filterScores();

    } catch (error) {
        console.error("Error fetching scores:", error);
        container.innerHTML = '<div class="loading-state" style="color: #ef4444;">Failed to load data. Check console for details.</div>';
    }
}

function populateScoreCategoryDropdown() {
    const filter = document.getElementById('scoreCategoryFilter');
    const uniqueCategories = [...new Set(allScores.map(s => s.category))].filter(Boolean);
    
    filter.innerHTML = '<option value="All">All Subjects</option>';
    uniqueCategories.forEach(cat => { filter.innerHTML += `<option value="${cat}">${cat}</option>`; });
}

function filterScores() {
    const searchTerm = document.getElementById('searchScoreInput').value.toLowerCase();
    const selectedCat = document.getElementById('scoreCategoryFilter').value;

    currentFilteredScores = allScores.filter(s => {
        const safeName = s.student_name ? s.student_name.toLowerCase() : '';
        const matchesSearch = safeName.includes(searchTerm);
        const matchesCat = selectedCat === 'All' || s.category === selectedCat;
        return matchesSearch && matchesCat;
    });

    scoreDisplayLimit = 50; 
    renderScores();
}

function renderScores() {
    const container = document.getElementById('scoresContainer');
    if (currentFilteredScores.length === 0) { 
        container.innerHTML = `<div class="loading-state">No matching scores found.</div>`; 
        return; 
    }
    container.innerHTML = '';

    const toDisplay = currentFilteredScores.slice(0, scoreDisplayLimit);

    toDisplay.forEach(result => {
        const dateObj = new Date(result.created_at);
        const formattedDate = dateObj.toLocaleDateString();
        
        const isPassing = result.percentage >= 75;
        const badgeClass = isPassing ? 'status-online' : 'status-offline';
        const badgeIcon = isPassing ? 'fa-circle-check' : 'fa-triangle-exclamation';

        const row = document.createElement('div');
        row.className = 'user-row';

        row.innerHTML = `
            <div class="questions-subtitle">${formattedDate}</div>
            <div class="user-name-text">${result.student_name || 'Unknown Student'}</div>
            <div class="user-email-text">${result.category}</div>
            <div>
                <span class="role-badge role-student">${result.score} / ${result.total_questions}</span>
            </div>
            <div>
                <span class="status-text ${badgeClass}">
                    <i class="fa-solid ${badgeIcon}"></i> ${result.percentage}%
                </span>
            </div>
        `;
        container.appendChild(row);
    });

    // Load More Logic
    if (currentFilteredScores.length > scoreDisplayLimit) {
        const remainingCount = currentFilteredScores.length - scoreDisplayLimit;
        const loadMoreWrapper = document.createElement('div');
        loadMoreWrapper.style.textAlign = 'center';
        loadMoreWrapper.style.padding = '20px 0';

        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.innerHTML = `Load More (${remainingCount} remaining) <i class="fa-solid fa-angle-down"></i>`;
        
        // Match the Brutalist styling used in questions.js
        loadMoreBtn.style.padding = '12px 24px';
        loadMoreBtn.style.background = '#C4B5FD';
        loadMoreBtn.style.color = '#111827';
        loadMoreBtn.style.border = '3px solid #111827';
        loadMoreBtn.style.borderRadius = '8px';
        loadMoreBtn.style.fontWeight = '900';
        loadMoreBtn.style.cursor = 'pointer';
        loadMoreBtn.style.boxShadow = '4px 4px 0px #111827';
        loadMoreBtn.style.transition = 'all 0.1s ease';

        loadMoreBtn.onmouseover = () => { loadMoreBtn.style.transform = 'translateY(-2px)'; };
        loadMoreBtn.onmouseout = () => { loadMoreBtn.style.transform = 'translateY(0)'; };

        loadMoreBtn.onclick = () => {
            scoreDisplayLimit += 50; 
            renderScores();  
        };

        loadMoreWrapper.appendChild(loadMoreBtn);
        container.appendChild(loadMoreWrapper);
    }
}