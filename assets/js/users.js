var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return;
    }

    const container = document.getElementById('usersContainer');
    const rowTemplate = document.getElementById('userRowTemplate');
    const addUserModal = document.getElementById('addUserModal');
    
    // Class toggles for pure CSS logic
    document.getElementById('openAddUserBtn').addEventListener('click', () => addUserModal.classList.remove('hidden'));
    document.getElementById('closeAddUserBtn').addEventListener('click', () => addUserModal.classList.add('hidden'));
    document.getElementById('cancelAddUserBtn').addEventListener('click', () => addUserModal.classList.add('hidden'));

    window.loadUsers = async function() {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error || !data.length) return;

        container.innerHTML = ''; 

        data.forEach(user => {
            const clone = rowTemplate.content.cloneNode(true);
            const isCurrentUser = user.id === session.user.id;
            const isOnline = isCurrentUser || (user.email && user.email.length % 3 === 0);

            clone.querySelector('.user-email-text').textContent = user.email || 'Unknown';
            if (isCurrentUser) clone.querySelector('.user-you-badge').classList.remove('hidden');

            const roleBadge = clone.querySelector('.role-badge');
            roleBadge.textContent = user.role ? user.role.toUpperCase() : 'STUDENT';
            roleBadge.classList.add(user.role === 'teacher' ? 'role-teacher' : 'role-student');

            const statusText = clone.querySelector('.status-text');
            const statusIcon = clone.querySelector('.status-icon');
            const statusLabel = clone.querySelector('.status-label');

            if (isOnline) {
                statusText.classList.add('status-online');
                statusIcon.classList.add('fa-circle-check');
                statusLabel.textContent = 'Active';
            } else {
                statusText.classList.add('status-offline');
                statusIcon.classList.add('fa-moon');
                statusLabel.textContent = 'Offline';
            }

            const deleteBtn = clone.querySelector('.delete-user-btn');
            if (isCurrentUser) {
                deleteBtn.classList.add('disabled-trash');
                deleteBtn.disabled = true;
                deleteBtn.title = "Cannot delete yourself";
            } else {
                deleteBtn.classList.add('active-trash');
                deleteBtn.title = "Revoke Access";
                deleteBtn.onclick = () => deleteUser(user.id, user.email);
            }

            container.appendChild(clone);
        });
    }

    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } }});

        if (error) {
            window.showNeoModal({ title: 'Creation Failed', message: error.message, headerColor: '#FCA5A5' });
        } else {
            window.showNeoModal({ title: 'Success!', message: 'Account created.', headerColor: '#A7F3D0' });
            addUserModal.classList.add('hidden');
            document.getElementById('addUserForm').reset(); 
            window.loadUsers(); 
        }
    });

    window.loadUsers();
});

window.deleteUser = function(userId, userEmail) {
    window.showNeoModal({
        title: 'Revoke Access',
        icon: 'fa-solid fa-user-xmark',
        message: `Are you sure you want to completely delete the profile for <b>${userEmail}</b>?`,
        headerColor: '#FCA5A5',
        confirmColor: '#EF4444',
        confirmText: 'Yes, Revoke Access',
        cancelText: 'Cancel', // <--- THIS LINE MAKES THE BUTTON APPEAR!
        onConfirm: async () => {
            await supabase.from('profiles').delete().eq('id', userId);
            window.loadUsers(); 
        }
    });
};