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
                
                // 🟢 UPDATED: Made the text neutral so it works for both Admins and Students!
                message: 'Are you sure you want to log out of your account?', 
                
                headerColor: '#FDE68A', 
                confirmColor: '#EF4444', 
                confirmText: 'Log Out',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    // SECURE SIGN OUT 
                    await supabase.auth.signOut();
                    
                    // 🟢 This correctly steps out of the admin/ or student/ folder
                    window.location.href = '../login.html';
                }
            });
        });
    }
});