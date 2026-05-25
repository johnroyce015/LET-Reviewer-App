document.addEventListener('DOMContentLoaded', () => {
    
    const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const loginForm = document.getElementById('loginForm');
    
    // 2. Grab the custom modal elements
    const errorModal = document.getElementById('errorModal');
    const errorMessageText = document.getElementById('errorMessageText');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalOkBtn = document.getElementById('modalOkBtn');

    // 3. Function to close the modal
    function closeModal() {
        errorModal.style.display = 'none';
    }

    // Attach click events to close buttons
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if(modalOkBtn) modalOkBtn.addEventListener('click', closeModal);

    // 4. Handle the Login process
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop the ghost refresh
            
            // Using your exact HTML IDs!
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // Attempt to sign in
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error("Login Failed:", error.message);
                
                // Human-friendly error message
                if (error.message.includes("Invalid login credentials")) {
                    errorMessageText.textContent = "The email or password you entered is incorrect. Please check your spelling and try again.";
                } else {
                    errorMessageText.textContent = error.message;
                }
                
                // Show the beautiful Neo-Brutalist modal
                errorModal.style.display = 'flex';
                
            } else {
                // Success! Send them to the dashboard
                window.location.href = 'dashboard.html'; 
            }
        });
    }
});