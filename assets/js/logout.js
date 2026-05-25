document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            // Call your new Universal Modal!
            window.showNeoModal({
                title: 'Confirm Logout',
                icon: 'fa-solid fa-right-from-bracket',
                message: 'Are you sure you want to log out of the admin panel?',
                headerColor: '#FDE68A', // Yellow
                confirmColor: '#EF4444', // Red button
                confirmText: 'Log Out',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    // Sign out of Supabase and redirect
                    await supabase.auth.signOut();
                    window.location.href = 'login.html';
                }
            });
        });
    }
});