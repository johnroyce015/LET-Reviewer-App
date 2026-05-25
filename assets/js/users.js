// INITIALIZE SUPABASE
const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. SECURITY BOUNCER
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return; 
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
            // NOTE: This assumes you have created a table named 'profiles' in Supabase to track your users.
            const { data, error } = await supabase.from('profiles').select('*');

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; font-weight: bold;">No users found in profiles table.</div>';
                return;
            }

            container.innerHTML = ''; // Clear loading text

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

    // 4. HANDLE ACCOUNT CREATION
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        // Step A: Create the Auth account AND pass the role to the trigger
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    role: role // The SQL trigger grabs this and puts it in the profiles table!
                }
            }
        });

        if (authError) {
            alert("Error creating account: " + authError.message);
            return;
        }

        // We completely delete "Step B" because the database handles it automatically now!

        alert("Success! Account created.");
        closeModal();
        addUserForm.reset(); 
        loadUsers(); 
    });

    // Run the load function on startup
    loadUsers();
});