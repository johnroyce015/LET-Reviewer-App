var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            // Call the Universal Modal
            window.showNeoModal({
                title: 'Confirm Logout',
                icon: 'fa-solid fa-right-from-bracket',
                message: 'Are you sure you want to log out of the admin panel?',
                headerColor: '#FDE68A', 
                confirmColor: '#EF4444', 
                confirmText: 'Log Out',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    // SECURE SIGN OUT (Fixed typo to use shared supabase client)
                    await supabase.auth.signOut();
                    window.location.href = 'login.html';
                }
            });
        });
    }
});