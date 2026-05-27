var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return; 
    }

    fetchDashboardStats(session.user.id);
    fetchRecentActivity();
});

async function fetchDashboardStats(currentUserId) {
    const statQuestions = document.getElementById('statQuestions');
    const statCategories = document.getElementById('statCategories');
    const statUsers = document.getElementById('statUsers');
    const statActive = document.getElementById('statActive');
    
    const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    if (statQuestions) statQuestions.textContent = qCount || 0;

    const { count: cCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (statCategories) statCategories.textContent = cCount || 0;

    const { data: allUsers } = await supabase.from('profiles').select('id, email');
    if (allUsers && statUsers) {
        statUsers.textContent = allUsers.length;
        
        if (statActive) {
            let activeCount = 0;
            allUsers.forEach(u => {
                // Exact algorithm mapped from users.js to sync the demo
                const isCurrentUser = u.id === currentUserId;
                const isOnline = isCurrentUser || (u.email && u.email.length % 3 === 0);
                if (isOnline) activeCount++;
            });
            statActive.textContent = activeCount;
        }
    }
}

async function fetchRecentActivity() {
    const { data: recentQuestions } = await supabase
        .from('questions')
        .select('question_text, category, created_at')
        .order('id', { ascending: false })
        .limit(3);

    if (recentQuestions && recentQuestions.length > 0) {
        const activityContainer = document.getElementById('activityFeedContainer');
        const template = document.getElementById('recentActivityTemplate');
        
        if (activityContainer && template) {
            activityContainer.innerHTML = ''; 
            activityContainer.className = 'activity-feed'; // Applies clean CSS

            recentQuestions.forEach(q => {
                const clone = template.content.cloneNode(true);
                const date = new Date(q.created_at).toLocaleDateString();
                
                clone.querySelector('.activity-text').textContent = `"${q.question_text.substring(0, 45)}..."`;
                clone.querySelector('.activity-meta').textContent = `${q.category} • ${date}`;
                
                activityContainer.appendChild(clone);
            });
        }
    }
}