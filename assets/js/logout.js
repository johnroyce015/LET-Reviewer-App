document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Give the logout script its own isolated connection
    const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
    const logoutSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            // Call the Universal Modal
            window.showNeoModal({
                title: 'Confirm Logout',
                icon: 'fa-solid fa-right-from-bracket',
                message: 'Are you sure you want to log out of the admin panel?',
                headerColor: '#FDE68A', // Yellow
                confirmColor: '#EF4444', // Red button
                confirmText: 'Log Out',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    
                    // 2. Securely sign out
                    await logoutSupabase.auth.signOut();
                    
                    // 3. Kick them back to the login screen
                    window.location.href = 'login.html';
                }
            });
        });
    }
});