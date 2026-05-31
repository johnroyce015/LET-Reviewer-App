var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return; 
    }

document.body.style.visibility = 'visible';

    // 1. SILENT PING: Update this user's "last_active_at" timestamp to right now!
    await supabase.from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', session.user.id);

    // 2. Fetch the newly synced data
    fetchDashboardStats();
    fetchRecentActivity();
});

async function fetchDashboardStats() {
    const statQuestions = document.getElementById('statQuestions');
    const statCategories = document.getElementById('statCategories');
    const statUsers = document.getElementById('statUsers');
    const statActive = document.getElementById('statActive');
    
    const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    if (statQuestions) statQuestions.textContent = qCount || 0;

    const { count: cCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (statCategories) statCategories.textContent = cCount || 0;

    // 3. REAL ACTIVE USER TRACKING
    const { data: allUsers } = await supabase.from('profiles').select('id, email, last_active_at');
    if (allUsers && statUsers) {
        statUsers.textContent = allUsers.length;
        
        if (statActive) {
            let activeCount = 0;
            // Calculate what time it was exactly 24 hours ago
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); 

            allUsers.forEach(u => {
                // If they have a timestamp AND it is newer than 24 hours ago, they are Active!
                if (u.last_active_at && new Date(u.last_active_at) > twentyFourHoursAgo) {
                    activeCount++;
                }
            });
            statActive.textContent = activeCount;
        }
    }
}

async function fetchRecentActivity() {
    // 4. UNIFIED LOGS: Now querying the real activity_logs table!
    const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4); // Grab the 4 newest actions

    const activityContainer = document.getElementById('activityFeedContainer');
    const template = document.getElementById('recentActivityTemplate');

    if (logs && logs.length > 0) {
        if (activityContainer && template) {
            activityContainer.innerHTML = ''; 
            activityContainer.className = 'activity-feed'; 

            logs.forEach(log => {
                const clone = template.content.cloneNode(true);
                
                // Format the date nicely
                const dateObj = new Date(log.created_at);
                const timeString = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                // Inject the real log data into the dashboard template
                clone.querySelector('.activity-text').textContent = log.description;
                clone.querySelector('.activity-meta').textContent = `${log.action_type} by ${log.user_email.split('@')[0]} • ${dateString}, ${timeString}`;
                
                activityContainer.appendChild(clone);
            });
        }
    } else {
        if (activityContainer) {
            activityContainer.innerHTML = '<div style="padding: 20px; color: #6B7280; font-weight: 600;">System is quiet. No recent activity.</div>';
        }
    }
}