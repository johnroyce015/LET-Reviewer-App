// INITIALIZE SUPABASE
const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

    const container = document.getElementById('usersContainer');
    const addUserBtn = document.getElementById('openAddUserBtn');
    const addUserModal = document.getElementById('addUserModal');
    const addUserForm = document.getElementById('addUserForm');

    // 2. MODAL CONTROLS
    const closeModal = () => addUserModal.style.display = 'none';
    addUserBtn.addEventListener('click', () => addUserModal.style.display = 'flex');
    document.getElementById('closeAddUserBtn').addEventListener('click', closeModal);
    document.getElementById('cancelAddUserBtn').addEventListener('click', closeModal);

    // 3. FETCH USERS FROM DATABASE
    async function loadUsers() {
        try {
            const { data, error } = await supabase.from('profiles').select('*');

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; font-weight: bold;">No users found in profiles table.</div>';
                return;
            }

            container.innerHTML = ''; 

            data.forEach(user => {
                const row = document.createElement('div');
                row.style = "display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 15px 20px; border-bottom: 2px solid #111827; align-items: center; background: #FFFFFF; font-weight: 500;";
                row.innerHTML = `
                    <div style="font-weight: 700;">${user.email || 'Unknown'}</div>
                    <div>
                        <span style="background: ${user.role === 'teacher' ? '#C4B5FD' : '#E0E7FF'}; color: #111827; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; border: 2px solid #111827;">
                            ${user.role ? user.role.toUpperCase() : 'STUDENT'}
                        </span>
                    </div>
                    <div><span style="color: #10B981; font-weight: bold;">Active</span></div>
                    <div style="display: flex; gap: 10px;">
                        <button style="background: #FCA5A5; border: 2px solid #111827; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-weight: bold;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                container.appendChild(row);
            });
        } catch (err) {
            console.error("Error loading users:", err);
            container.innerHTML = `<div style="padding: 20px; text-align: center; color: #EF4444; font-weight: bold;">Error loading users. (Did you create a 'profiles' table?)</div>`;
        }
    }

    // 4. HANDLE ACCOUNT CREATION (Fixed Trigger Integration)
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        // Create the Auth account AND pass the role to the trigger
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    role: role 
                }
            }
        });

        if (authError) {
            alert("Error creating account: " + authError.message);
            return;
        }

        alert("Success! Account created.");
        closeModal();
        addUserForm.reset(); 
        loadUsers(); 
    });

    loadUsers();
});