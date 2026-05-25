document.addEventListener('DOMContentLoaded', () => {
    
    // (Don't forget to paste your URL and ANON KEY here again!)
    const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const loginForm = document.getElementById('loginForm');
    
    // Grab the modal elements (Removed closeModalBtn)
    const errorModal = document.getElementById('errorModal');
    const errorMessageText = document.getElementById('errorMessageText');
    const modalOkBtn = document.getElementById('modalOkBtn');

    // Function to close the modal
    function closeModal() {
        errorModal.style.display = 'none';
    }

    // Attach click event ONLY to the "Try Again" button now
    if(modalOkBtn) modalOkBtn.addEventListener('click', closeModal);

    // Handle the Login process
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error("Login Failed:", error.message);
                
                if (error.message.includes("Invalid login credentials")) {
                    errorMessageText.textContent = "The email or password you entered is incorrect. Please check your spelling and try again.";
                } else {
                    errorMessageText.textContent = error.message;
                }
                
                errorModal.style.display = 'flex';
                
            } else {
                window.location.href = 'dashboard.html'; 
            }
        });
    }
    // --- HANDLE REGISTRATION ---
    const registerForm = document.getElementById('registerForm');
    const regMessage = document.getElementById('regMessage');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const role = document.querySelector('input[name="role"]:checked').value;

            // Create the account and pass the metadata for the trigger
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        role: role
                    }
                }
            });

            if (error) {
                console.error("Registration Failed:", error.message);
                regMessage.style.color = '#EF4444'; // Neo-brutalist Red
                regMessage.textContent = error.message;
            } else {
                regMessage.style.color = '#10B981'; // Neo-brutalist Green
                regMessage.textContent = "Registration successful! You can now sign in.";
                registerForm.reset();
                
                // Optional: Automatically redirect them to login after a second
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        });
    }
});