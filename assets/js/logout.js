document.addEventListener('DOMContentLoaded', () => {
    // Grab the buttons and modal
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutBtn = document.getElementById('closeLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    // 1. Show the modal when Logout is clicked in the sidebar
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the browser from jumping to the top of the page
            logoutModal.style.display = 'flex';
        });
    }

    // 2. Function to hide the modal
    const hideModal = () => {
        if (logoutModal) logoutModal.style.display = 'none';
    };

    // Attach hide function to the X and Cancel buttons
    if (closeLogoutBtn) closeLogoutBtn.addEventListener('click', hideModal);
    if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', hideModal);

    // 3. The actual Logout action
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            // Optional: If you want to force Supabase to clear the session securely:
            // supabase.auth.signOut(); 
            
            // Redirect back to the login page
            window.location.href = 'login.html';
        });
    }
});