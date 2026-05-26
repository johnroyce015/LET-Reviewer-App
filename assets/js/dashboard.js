var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. THE VIP BOUNCER: Check session AND role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        window.location.href = 'login.html';
        return; 
    }

    // Actually fetch the profile data from the database first!
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    // If they aren't a teacher or admin, kick them out!
    if (profileError || !profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        
        window.showNeoModal({
            title: 'Access Denied',
            icon: 'fa-solid fa-hand',
            message: 'You are signed in as a Student. You do not have permission to access the Teacher Admin Panel.',
            headerColor: '#FCA5A5', 
            confirmColor: '#EF4444', 
            confirmText: 'Return to Homepage',
            onConfirm: async () => {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            }
        });
        
        return; 
    }

    // 2. Fetch the live data
    fetchDashboardStats();
});

async function fetchDashboardStats() {
    const statQuestions = document.getElementById('statQuestions');
    const statCategories = document.getElementById('statCategories');
    const statUsers = document.getElementById('statUsers');
    const statActive = document.getElementById('statActive');

    if(statQuestions) statQuestions.textContent = '...';
    if(statCategories) statCategories.textContent = '...';
    
    // --- 1. COUNT QUESTIONS ---
    const { count: qCount, error: qError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
        
    if (!qError && statQuestions) {
        statQuestions.textContent = qCount;
    }

    // --- 2. COUNT CATEGORIES ---
    const { count: cCount, error: cError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
        
    if (!cError && statCategories) {
        statCategories.textContent = cCount || 0;
    }

    // --- 3. COUNT USERS ---
    if(statUsers && statActive) {
        statUsers.textContent = '142'; 
        statActive.textContent = '28'; 
    }
}