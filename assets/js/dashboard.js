const supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. THE VIP BOUNCER: Check session AND role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If they aren't a teacher or admin, kick them out!
    if (profileError || !profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        
        // Trigger the Universal Modal
        window.showNeoModal({
            title: 'Access Denied',
            icon: 'fa-solid fa-hand',
            message: 'You are signed in as a Student. You do not have permission to access the Teacher Admin Panel.',
            headerColor: '#FCA5A5', // Neo-brutalist Red
            confirmColor: '#EF4444', 
            confirmText: 'Return to Homepage',
            onConfirm: async () => {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            }
        });
        
        return; // Stop the rest of the page from loading
    }

    // 2. Fetch the live data
    fetchDashboardStats();
});

async function fetchDashboardStats() {
    // Grab the HTML elements
    const statQuestions = document.getElementById('statQuestions');
    const statCategories = document.getElementById('statCategories');
    const statUsers = document.getElementById('statUsers');
    const statActive = document.getElementById('statActive');

    // Make them say "..." while loading
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
        statUsers.textContent = '142'; // Static placeholder
        statActive.textContent = '28'; // Static placeholder
    }
}