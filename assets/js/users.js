var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. THE VIP BOUNCER
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return;
    }

document.body.style.visibility = 'visible';

    const container = document.getElementById('usersContainer');
    
    // MODAL ELEMENTS
    const addUserModal = document.getElementById('addUserModal');
    const editUserModal = document.getElementById('editUserModal');
    
    // TOGGLES (No inline styles!)
    document.getElementById('openAddUserBtn').addEventListener('click', () => addUserModal.classList.remove('hidden'));
    document.getElementById('cancelAddUserBtn').addEventListener('click', () => {
        addUserModal.classList.add('hidden');
        document.getElementById('addUserForm').reset();
    });
    document.getElementById('cancelEditUserBtn').addEventListener('click', () => {
        editUserModal.classList.add('hidden');
        document.getElementById('editUserForm').reset();
    });

    // 2. FETCH USERS FROM DATABASE (WITH REAL TIMESTAMPS)
    window.loadUsers = async function() {
        // We select all columns so we get last_active_at too!
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            container.innerHTML = '<div class="loading-state">No users found.</div>';
            return;
        }

        container.innerHTML = ''; 
        
        // Calculate the exact time 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); 

        data.forEach(user => {
            const isCurrentUser = user.id === session.user.id;
            
            // 🔥 REAL TRACKER LOGIC: Are they the current user, or is their timestamp within the last 24 hours?
            const isOnline = isCurrentUser || (user.last_active_at && new Date(user.last_active_at) > twentyFourHoursAgo);
            
            const row = document.createElement('div');
            row.className = 'user-row'; // Keeping your original CSS class!
            
            row.innerHTML = `
                <div class="user-name-text">${user.full_name || 'No Name Provided'}</div>
                <div class="user-email-text">
                    ${user.email} ${isCurrentUser ? '<span class="user-you-badge">(You)</span>' : ''}
                </div>
                <div>
                    <span class="role-badge ${user.role === 'teacher' ? 'role-teacher' : 'role-student'}">
                        ${user.role ? user.role.toUpperCase() : 'STUDENT'}
                    </span>
                </div>
                <div>
                    <span class="status-text ${isOnline ? 'status-online' : 'status-offline'}">
                        <i class="fa-solid ${isOnline ? 'fa-circle-check' : 'fa-moon'}"></i> ${isOnline ? 'Active' : 'Offline'}
                    </span>
                </div>
                <div class="action-cell">
                    <button onclick="openEditModal('${user.id}', '${user.full_name || ''}', '${user.role || 'student'}')" class="delete-user-btn" title="Edit User">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteUser('${user.id}', '${user.email}')" class="delete-user-btn ${isCurrentUser ? 'disabled-trash' : 'active-trash'}" ${isCurrentUser ? 'disabled' : ''} title="Revoke Access">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // 3. HANDLE ACCOUNT CREATION
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const name = document.getElementById('newName').value;
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: name, role: role } }
        });

        if (error) {
            window.showNeoModal({ title: 'Creation Failed', icon: 'fa-solid fa-triangle-exclamation', message: error.message, headerColor: '#FCA5A5' });
        } else {
            // 🔥 THE NEW TRACKER!
            await window.logSystemActivity('CREATE', `Added a new ${role} account for ${email}`);
            
            addUserModal.classList.add('hidden');
            document.getElementById('addUserForm').reset(); 
            window.loadUsers(); 
        }
    });

    // 4. HANDLE ACCOUNT EDITING
    window.openEditModal = function(id, currentName, currentRole) {
        document.getElementById('editUserId').value = id;
        document.getElementById('editName').value = currentName;
        document.getElementById('editRole').value = currentRole;
        editUserModal.classList.remove('hidden');
    };

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editUserId').value;
        const newName = document.getElementById('editName').value;
        const newRole = document.getElementById('editRole').value;

        const { error } = await supabase.from('profiles').update({ full_name: newName, role: newRole }).eq('id', id);

        if (error) {
            window.showNeoModal({ title: 'Update Failed', icon: 'fa-solid fa-triangle-exclamation', message: error.message, headerColor: '#FCA5A5' });
        } else {
            // 🔥 THE NEW TRACKER!
            await window.logSystemActivity('UPDATE', `Modified user profile for: ${newName}`);

            editUserModal.classList.add('hidden');
            window.loadUsers();
        }
    });

    window.loadUsers();
});

// 5. SECURE DELETE FUNCTION (WITH PIN CONFIRMATION)
window.deleteUser = function(userId, userEmail) {
    window.showNeoModal({
        title: 'Security Authorization',
        icon: 'fa-solid fa-lock',
        message: `Enter the Admin PIN to permanently revoke access for <b>${userEmail}</b>.`,
        requireInput: true,
        inputType: 'password', // Hides the characters as they type!
        inputPlaceholder: 'Enter 6-digit PIN (e.g. 123456)',
        headerColor: '#FCA5A5',
        confirmColor: '#EF4444',
        confirmText: 'Verify & Revoke',
        cancelText: 'Cancel',
        onConfirm: async (pin) => {
            
            // Check the PIN!
            if (pin !== '123456') {
                window.showNeoModal({ 
                    title: 'Access Denied', 
                    icon: 'fa-solid fa-triangle-exclamation', 
                    message: 'Incorrect Security PIN. Action aborted.', 
                    headerColor: '#FCA5A5' 
                });
                return;
            }

            // If PIN is correct, proceed with deletion
            await supabase.from('profiles').delete().eq('id', userId);
            
            await window.logSystemActivity('DELETE', `Revoked system access for: ${userEmail}`);
            window.loadUsers(); 
        }
    });
};