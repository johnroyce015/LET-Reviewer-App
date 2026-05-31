var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. VIP BOUNCER (Only Teachers/Admins can view logs)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return; 
    }

document.body.style.visibility = 'visible';

    // Bind function globally so the Refresh button works
    window.fetchLiveLogs = fetchLiveLogs;

    // 2. Load the data
    fetchLiveLogs();
});

async function fetchLiveLogs() {
    const container = document.getElementById('logsContainer');
    const template = document.getElementById('logRowTemplate');
    
    container.innerHTML = '<div class="loading-state">Fetching logs...</div>';
    
    const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Only load the 50 most recent to keep the app fast

    if (error) {
        container.innerHTML = `<div class="loading-state" style="color: #EF4444;">Database Error: ${error.message}</div>`;
        return;
    }

    if (!logs || logs.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <i class="fa-solid fa-clipboard-check empty-icon gray"></i>
            <h3 class="empty-title">System is quiet</h3>
            <p class="empty-subtitle">No recent activity logged in the database.</p>
        </div>`;
        return;
    }

    container.innerHTML = ''; 

    logs.forEach(log => {
        const clone = template.content.cloneNode(true);
        
        // Format Date (e.g., "Oct 24, 2026, 2:30 PM")
        const dateObj = new Date(log.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + 
                              dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        clone.querySelector('.log-time').textContent = formattedDate;
        clone.querySelector('.user-email-text').textContent = log.user_email;
        clone.querySelector('.log-desc').textContent = log.description;

        // Apply Color Badge Based on Action Type
        const badge = clone.querySelector('.action-badge');
        badge.textContent = log.action_type;
        
        const type = log.action_type.toLowerCase();
        
        // 🟢 Added 'upload' to the Create (Green) badge styling!
        if (type.includes('create') || type.includes('add') || type.includes('upload')) {
            badge.classList.add('action-create');
        }
        else if (type.includes('delete') || type.includes('remove')) {
            badge.classList.add('action-delete');
        }
        else if (type.includes('update') || type.includes('edit')) {
            badge.classList.add('action-update');
        }
        else {
            badge.classList.add('action-login');
        }

        container.appendChild(clone);
    });
}