var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Skip Login if already authenticated 
    const { data: { session } } = await supabase.auth.getSession();
    if (session && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // --- HANDLE LOGIN ---
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // Visual loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            submitBtn.disabled = true;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                let errorMsg = error.message;
                if (errorMsg.includes("Invalid login credentials")) {
                    errorMsg = "The email or password you entered is incorrect. Please check your spelling and try again.";
                }
                
                window.showNeoModal({
                    title: 'Login Failed',
                    icon: 'fa-solid fa-triangle-exclamation',
                    message: errorMsg,
                    headerColor: '#FCA5A5',
                    confirmColor: '#111827'
                });
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            } else {
                
                // VIP Bouncer Check
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

                if (profile && (profile.role === 'teacher' || profile.role === 'admin')) {
                    window.location.href = 'dashboard.html';
                } else {
                    window.showNeoModal({
                        title: 'Access Restricted',
                        icon: 'fa-solid fa-hand',
                        message: 'This web dashboard is exclusively for Teachers. Students must use the mobile application to take mock exams.',
                        headerColor: '#FCA5A5',
                        confirmColor: '#EF4444',
                        confirmText: 'Sign Out',
                        onConfirm: async () => {
                            await supabase.auth.signOut();
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                        }
                    });
                }
            }
        });
    }

    // --- HANDLE REGISTRATION ---
    const registerForm = document.getElementById('registerForm');
    const regSubmitBtn = document.getElementById('regSubmitBtn');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const role = document.querySelector('input[name="role"]:checked').value;

            const originalRegText = regSubmitBtn.innerHTML;
            regSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
            regSubmitBtn.disabled = true;

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name, role: role } }
            });

            if (error) {
                window.showNeoModal({
                    title: 'Registration Failed',
                    icon: 'fa-solid fa-triangle-exclamation',
                    message: error.message,
                    headerColor: '#FCA5A5',
                    confirmColor: '#111827'
                });
                regSubmitBtn.innerHTML = originalRegText;
                regSubmitBtn.disabled = false;
            } else {
                window.showNeoModal({
                    title: 'Success!',
                    icon: 'fa-solid fa-check',
                    message: 'Registration successful! You can now sign in.',
                    headerColor: '#A7F3D0',
                    confirmColor: '#10B981',
                    onConfirm: () => { window.location.href = 'login.html'; }
                });
                registerForm.reset();
            }
        });
    }
});