// INITIALIZE SUPABASE
const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. THE VIP BOUNCER: Check session AND role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        window.location.href = 'login.html';
        return; 
    }

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profileError || !profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.showNeoModal({
            title: 'Access Denied',
            icon: 'fa-solid fa-hand',
            message: 'You do not have permission to view the Teacher Admin Panel.',
            headerColor: '#FCA5A5',
            confirmColor: '#EF4444',
            confirmText: 'Return Home',
            onConfirm: async () => {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            }
        });
        return;
    }

    const container = document.getElementById('usersContainer');
    const addUserBtn = document.getElementById('openAddUserBtn');
    const addUserModal = document.getElementById('addUserModal');
    const addUserForm = document.getElementById('addUserForm');

    // 2. MODAL CONTROLS
    const closeModal = () => { if(addUserModal) addUserModal.style.display = 'none'; };
    if(addUserBtn) addUserBtn.addEventListener('click', () => addUserModal.style.display = 'flex');
    if(document.getElementById('closeAddUserBtn')) document.getElementById('closeAddUserBtn').addEventListener('click', closeModal);
    if(document.getElementById('cancelAddUserBtn')) document.getElementById('cancelAddUserBtn').addEventListener('click', closeModal);

    // 3. FETCH USERS FROM DATABASE
    window.loadUsers = async function() {
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; font-weight: bold;">No users found.</div>';
                return;
            }

            container.innerHTML = ''; 

            data.forEach(user => {
                const row = document.createElement('div');
                row.style = "display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 15px 20px; border-bottom: 2px solid #111827; align-items: center; background: #FFFFFF; font-weight: 500;";
                row.innerHTML = `
                    <div style="font-weight: 700;">${user.email || 'Unknown'}</div>
                    <div>
                        <span style="background: ${user.role === 'teacher' ? '#C4B5FD' : '#FDE68A'}; color: #111827; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; border: 2px solid #111827;">
                            ${user.role ? user.role.toUpperCase() : 'STUDENT'}
                        </span>
                    </div>
                    <div><span style="color: #10B981; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Active</span></div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="deleteUser('${user.id}', '${user.email}')" class="action-btn" style="color: #EF4444; border-radius: 6px; width: 36px; height: 36px;" title="Revoke Access">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(row);
            });
        } catch (err) {
            console.error("Error loading users:", err);
            container.innerHTML = `<div style="padding: 20px; text-align: center; color: #EF4444; font-weight: bold;">Error loading users.</div>`;
        }
    }

    // 4. HANDLE ACCOUNT CREATION
    if(addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('newEmail').value;
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { role: role } }
            });

            if (authError) {
                window.showNeoModal({
                    title: 'Creation Failed',
                    icon: 'fa-solid fa-triangle-exclamation',
                    message: authError.message,
                    headerColor: '#FCA5A5',
                    confirmColor: '#111827'
                });
                return;
            }

            window.showNeoModal({
                title: 'Success!',
                icon: 'fa-solid fa-user-check',
                message: `Account for ${email} successfully created.`,
                headerColor: '#A7F3D0',
                confirmColor: '#10B981'
            });
            
            closeModal();
            addUserForm.reset(); 
            window.loadUsers(); 
        });
    }

    // Run the load function on startup
    window.loadUsers();
});

// 5. SECURE DELETE FUNCTION
window.deleteUser = function(userId, userEmail) {
    window.showNeoModal({
        title: 'Revoke Access',
        icon: 'fa-solid fa-user-xmark',
        message: `Are you sure you want to delete the profile for <b>${userEmail}</b>? They will immediately lose access to the system.`,
        headerColor: '#FCA5A5',
        confirmColor: '#EF4444',
        confirmText: 'Yes, Revoke Access',
        cancelText: 'Cancel',
        onConfirm: async () => {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) {
                window.showNeoModal({
                    title: 'Error Deleting User',
                    message: error.message,
                    headerColor: '#FCA5A5',
                    confirmColor: '#111827'
                });
            } else {
                window.loadUsers(); 
            }
        }
    });
};