var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {

    // 1. THE VIP BOUNCER
    // 🌟 Note: 'session.user.email' is captured right here when the Admin first loads the page!
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    const userRole = profileData && profileData.role ? profileData.role.toLowerCase() : 'student';

    if (userRole !== 'teacher' && userRole !== 'admin') {
        window.location.href = '../login.html'; return;
    }

    document.body.style.visibility = 'visible';

    const container = document.getElementById('usersContainer');
    const addUserModal = document.getElementById('addUserModal');
    const editUserModal = document.getElementById('editUserModal');

    // TOGGLES 
    document.getElementById('openAddUserBtn').addEventListener('click', () => addUserModal.classList.remove('hidden'));
    document.getElementById('cancelAddUserBtn').addEventListener('click', () => {
        addUserModal.classList.add('hidden');
        document.getElementById('addUserForm').reset();
    });
    document.getElementById('cancelEditUserBtn').addEventListener('click', () => {
        editUserModal.classList.add('hidden');
        document.getElementById('editUserForm').reset();
    });

    // 2. FETCH USERS FROM DATABASE 
    window.loadUsers = async function () {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            container.innerHTML = '<div class="loading-state">No users found.</div>';
            return;
        }

        container.innerHTML = '';
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        data.forEach(user => {
            const isCurrentUser = user.id === session.user.id;
            const isOnline = isCurrentUser || (user.last_active_at && new Date(user.last_active_at) > twentyFourHoursAgo);
            const safeRole = user.role ? user.role.toLowerCase() : 'student';

            const row = document.createElement('div');
            row.className = 'user-row';

            row.innerHTML = `
                <div class="user-name-text">${user.full_name || 'No Name Provided'}</div>
                <div class="user-email-text">
                    ${user.email} ${isCurrentUser ? '<span class="user-you-badge">(You)</span>' : ''}
                    <div class="questions-subtitle">${user.course || 'No Course Assigned'}</div>
                </div>
                <div>
                    <span class="role-badge role-${safeRole}">
                        ${user.role ? user.role.toUpperCase() : 'STUDENT'}
                    </span>
                </div>
                <div>
                    <span class="status-text ${isOnline ? 'status-online' : 'status-offline'}">
                        <i class="fa-solid ${isOnline ? 'fa-circle-check' : 'fa-moon'}"></i> ${isOnline ? 'Active' : 'Offline'}
                    </span>
                </div>
                <div class="action-cell">
                    <button class="delete-user-btn action-edit-btn" data-id="${user.id}" data-name="${user.full_name || ''}" data-role="${safeRole}" data-course="${user.course || 'BEEd'}" title="Edit User">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="delete-user-btn action-delete-btn ${isCurrentUser ? 'disabled-trash' : 'active-trash'}" data-id="${user.id}" data-email="${user.email}" ${isCurrentUser ? 'disabled' : ''} title="Revoke Access">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // EVENT DELEGATION FOR EDIT AND DELETE BUTTONS
    container.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.action-edit-btn');
        if (editBtn) {
            document.getElementById('editUserId').value = editBtn.getAttribute('data-id');
            document.getElementById('editName').value = editBtn.getAttribute('data-name');
            document.getElementById('editRole').value = editBtn.getAttribute('data-role');
            document.getElementById('editCourse').value = editBtn.getAttribute('data-course');
            editUserModal.classList.remove('hidden');
        }

        const deleteBtn = e.target.closest('.action-delete-btn');
        if (deleteBtn && !deleteBtn.hasAttribute('disabled')) {
            window.deleteUser(deleteBtn.getAttribute('data-id'), deleteBtn.getAttribute('data-email'));
        }
    });

    // 3. HANDLE ACCOUNT CREATION
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('newName').value;
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value.toLowerCase();
        const course = document.getElementById('newCourse').value;

        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: name, role: role, course: course } } 
        });

        if (error) {
            window.showNeoModal({ title: 'Creation Failed', icon: 'fa-solid fa-triangle-exclamation', message: error.message, headerColor: '#FCA5A5' });
        } else {
            // 🌟 FIX: Pass 'session.user.email' into the logger so it registers under the Admin's name!
            await window.logSystemActivity('CREATE', `Added a new ${role} account for ${email}`, session.user.email);
            addUserModal.classList.add('hidden');
            document.getElementById('addUserForm').reset();
            window.loadUsers();
        }
    });

    // 4. HANDLE ACCOUNT EDITING (WITH PIN SECURITY)
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('editUserId').value;
        const newName = document.getElementById('editName').value;
        const newRole = document.getElementById('editRole').value.toLowerCase();
        const newCourse = document.getElementById('editCourse').value;

        editUserModal.classList.add('hidden');

        window.showNeoModal({
            title: 'Security Authorization',
            icon: 'fa-solid fa-lock',
            message: `Enter the Admin PIN to confirm profile changes for <b>${newName}</b>.`,
            requireInput: true,
            inputType: 'password',
            inputPlaceholder: 'Enter 6-digit PIN',
            headerColor: '#FCA5A5',
            confirmColor: '#10B981',
            confirmText: 'Verify & Save',
            cancelText: 'Cancel',
            onCancel: () => {
                editUserModal.classList.remove('hidden');
            },
            onConfirm: async (pin) => {
                if (pin !== '123456') { 
                    window.showNeoModal({
                        title: 'Access Denied',
                        icon: 'fa-solid fa-triangle-exclamation',
                        message: 'Incorrect Security PIN. Action aborted.',
                        headerColor: '#FCA5A5'
                    });
                    return;
                }

                const { error } = await supabase.from('profiles').update({
                    full_name: newName,
                    role: newRole,
                    course: newCourse
                }).eq('id', id);

                if (error) {
                    window.showNeoModal({ title: 'Update Failed', icon: 'fa-solid fa-triangle-exclamation', message: error.message, headerColor: '#FCA5A5' });
                } else {
                    await window.logSystemActivity('UPDATE', `Modified user profile for: ${newName}`);
                    window.loadUsers();
                }
            }
        });
    });

    window.loadUsers();
});

// 5. SECURE DELETE FUNCTION
window.deleteUser = function (userId, userEmail) {
    window.showNeoModal({
        title: 'Security Authorization',
        icon: 'fa-solid fa-lock',
        message: `Enter the Admin PIN to permanently revoke access for <b>${userEmail}</b>.`,
        requireInput: true,
        inputType: 'password',
        inputPlaceholder: 'Enter 6-digit PIN',
        headerColor: '#FCA5A5',
        confirmColor: '#EF4444',
        confirmText: 'Verify & Revoke',
        cancelText: 'Cancel',
        onConfirm: async (pin) => {
            if (pin !== '123456') {
                window.showNeoModal({ title: 'Access Denied', icon: 'fa-solid fa-triangle-exclamation', message: 'Incorrect Security PIN. Action aborted.', headerColor: '#FCA5A5' });
                return;
            }

            const { error } = await supabase.rpc('delete_user_account', { target_user_id: userId });

            if (error) {
                window.showNeoModal({ title: 'Deletion Failed', icon: 'fa-solid fa-triangle-exclamation', message: error.message, headerColor: '#FCA5A5' });
                return;
            }

            await window.logSystemActivity('DELETE', `Revoked system access for: ${userEmail}`);
            window.loadUsers();
        }
    });
};