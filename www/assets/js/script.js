var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {

    /* ========================================================
       1. ADMIN SIDE: QUESTION FORM LOGIC
    ======================================================== */
    const questionForm = document.getElementById('questionForm');
    const statusMessage = document.getElementById('statusMessage');

    if (questionForm) {
        questionForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            const newQuestion = {
                category: document.getElementById('category').value,
                question_text: document.getElementById('question_text').value,
                option_a: document.querySelector('input[name="option_a"]').value,
                option_b: document.querySelector('input[name="option_b"]').value,
                option_c: document.querySelector('input[name="option_c"]').value,
                option_d: document.querySelector('input[name="option_d"]').value,
                correct_answer: document.querySelector('input[name="correct_answer"]:checked').value
            };

            const { data, error } = await supabase.from('questions').insert([newQuestion]);

            if (error) {
                statusMessage.style.color = 'red';
                statusMessage.textContent = 'Error: ' + error.message;
            } else {
                statusMessage.style.color = 'green';
                statusMessage.textContent = '✅ Question saved successfully!';
                questionForm.reset(); 
            }

            submitBtn.textContent = 'Save Question to Cloud';
            submitBtn.disabled = false;
        });
    }

    /* ========================================================
       2. STUDENT SIDE: PROFILE DRAWER & LOGOUT LOGIC
    ======================================================== */
    const openBtn = document.getElementById('openProfileSidebar');
    const closeBtn = document.getElementById('closeProfileSidebar');
    const drawer = document.getElementById('profileSidebarDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const logoutBtn = document.getElementById('sidebarLogoutBtn');

    // Toggle Animation Listeners
    if (openBtn && drawer && overlay) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            drawer.classList.add('open');
            overlay.classList.add('open');
            fetchSidebarProfile(); 
        });

        const closeDrawer = () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
        };

        closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);
    }

    // Fetch Profile Credentials from Supabase
    async function fetchSidebarProfile() {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (session) {
            const nameEl = document.getElementById('sidebarName');
            const courseEl = document.getElementById('sidebarCourse');
            
            if (nameEl) nameEl.textContent = session.user.user_metadata?.full_name || 'Student';
            if (courseEl) courseEl.textContent = session.user.user_metadata?.course || 'Major Subject';
        }
    }

    // Supabase Logout Execution
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging out...';
            
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
                // Redirects back to the login page
                window.location.href = '../login.html';
            }
        });
    }
});