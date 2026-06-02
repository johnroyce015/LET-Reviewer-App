var supabase = window.supabaseClient;
let allUsers = []; 
let currentFilteredUsers = []; 
let userDisplayLimit = 50;
let currentSessionUser = null;

document.addEventListener('DOMContentLoaded', async () => {

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }
    currentSessionUser = session.user;

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    const userRole = profileData && profileData.role ? profileData.role.toLowerCase() : 'student';

    if (userRole !== 'teacher' && userRole !== 'admin') {
        window.location.href = '../login.html'; return;
    }

    document.body.style.visibility = 'visible';

    const container = document.getElementById('usersContainer');
    const addUserModal = document.getElementById('addUserModal');
    const editUserModal = document.getElementById('editUserModal');

    // Attach Filter Events (Now pointing to the Course filter)
    document.getElementById('searchUserInput').addEventListener('input', filterUsers);
    document.getElementById('courseFilter').addEventListener('change', filterUsers);

    document.getElementById('openAddUserBtn').addEventListener('click', () => addUserModal.classList.remove('hidden'));
    document.getElementById('cancelAddUserBtn').addEventListener('click', () => {
        addUserModal.classList.add('hidden');
        document.getElementById('addUserForm').reset();
    });
    document.getElementById('cancelEditUserBtn').addEventListener('click', () => {
        editUserModal.classList.add('hidden');
        document.getElementById('editUserForm').reset();
    });

    window.loadUsers = async function () {
        container.innerHTML = '<div class="loading-state">Loading users...</div>';
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            container.innerHTML = '<div class="loading-state">No users found.</div>';
            return;
        }

        allUsers = data;
        populateCourseDropdown(); // Dynamically load courses into the dropdown
        filterUsers();
    };

    function populateCourseDropdown() {
        const filter = document.getElementById('courseFilter');
        
        // Extract unique courses, ignoring blank or null entries
        const uniqueCourses = [...new Set(allUsers.map(u => u.course))].filter(c => c && c.trim() !== '');
        
        filter.innerHTML = '<option value="All">All Courses</option>';
        uniqueCourses.forEach(course => { 
            filter.innerHTML += `<option value="${course}">${course}</option>`; 
        });
    }

    function filterUsers() {
        const searchTerm = document.getElementById('searchUserInput').value.toLowerCase();
        const selectedCourse = document.getElementById('courseFilter').value;

        currentFilteredUsers = allUsers.filter(user => {
            // Safety checks for null values
            const safeName = user.full_name ? user.full_name.toLowerCase() : '';
            const safeEmail = user.email ? user.email.toLowerCase() : '';
            const safeCourse = user.course ? user.course.toLowerCase() : '';
            
            // Search matches name, email, OR course
            const matchesSearch = safeName.includes(searchTerm) || safeEmail.includes(searchTerm) || safeCourse.includes(searchTerm);
            
            // Filter strictly checks the dropdown
            const matchesCourse = selectedCourse === 'All' || user.course === selectedCourse;
            
            return matchesSearch && matchesCourse;
        });

        userDisplayLimit = 50; 
        renderUsers();
    }

    function renderUsers() {
        if (currentFilteredUsers.length === 0) { 
            container.innerHTML = `<div class="loading-state">No matching users found.</div>`; 
            return; 
        }
        container.innerHTML = '';
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const toDisplay = currentFilteredUsers.slice(0, userDisplayLimit);

        toDisplay.forEach(user => {
            const isCurrentUser = user.id === currentSessionUser.id;
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
                    <button class="delete-user-btn action-edit-btn" data-id="${user.id}" data-name="${user.full_name || ''}" data-role="${safeRole}" data-course="${user.course || ''}" title="Edit User">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="delete-user-btn action-delete-btn ${isCurrentUser ? 'disabled-trash' : 'active-trash'}" data-id="${user.id}" data-email="${user.email}" ${isCurrentUser ? 'disabled' : ''} title="Revoke Access">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });

        if (currentFilteredUsers.length > userDisplayLimit) {
            const remainingCount = currentFilteredUsers.length - userDisplayLimit;
            const loadMoreWrapper = document.createElement('div');
            loadMoreWrapper.style.textAlign = 'center';
            loadMoreWrapper.style.padding = '20px 0';

            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.innerHTML = `Load More (${remainingCount} remaining) <i class="fa-solid fa-angle-down"></i>`;
            
            loadMoreBtn.style.padding = '12px 24px';
            loadMoreBtn.style.background = '#C4B5FD';
            loadMoreBtn.style.color = '#111827';
            loadMoreBtn.style.border = '3px solid #111827';
            loadMoreBtn.style.borderRadius = '8px';
            loadMoreBtn.style.fontWeight = '900';
            loadMoreBtn.style.cursor = 'pointer';
            loadMoreBtn.style.boxShadow = '4px 4px 0px #111827';
            loadMoreBtn.style.transition = 'all 0.1s ease';

            loadMoreBtn.onmouseover = () => { loadMoreBtn.style.transform = 'translateY(-2px)'; };
            loadMoreBtn.onmouseout = () => { loadMoreBtn.style.transform = 'translateY(0)'; };

            loadMoreBtn.onclick = () => {
                userDisplayLimit += 50; 
                renderUsers();  
            };

            loadMoreWrapper.appendChild(loadMoreBtn);
            container.appendChild(loadMoreWrapper);
        }
    }

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
            await window.logSystemActivity('CREATE', `Added a new ${role} account for ${email}`, currentSessionUser.email);
            addUserModal.classList.add('hidden');
            document.getElementById('addUserForm').reset();
            window.loadUsers();
        }
    });

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const newName = document.getElementById('editName').value;
        const newRole = document.getElementById('editRole').value.toLowerCase();
        const newCourse = document.getElementById('editCourse').value;
        
        editUserModal.classList.add('hidden');

        window.showNeoModal({
            title: 'Security Authorization', icon: 'fa-solid fa-lock', message: `Enter the Admin PIN to confirm profile changes for <b>${newName}</b>.`,
            requireInput: true, inputType: 'password', inputPlaceholder: 'Enter 6-digit PIN', headerColor: '#FCA5A5', confirmColor: '#10B981', confirmText: 'Verify & Save', cancelText: 'Cancel',
            onCancel: () => { editUserModal.classList.remove('hidden'); },
            onConfirm: async (pin) => {
                if (pin !== '123456') { window.showNeoModal({ title: 'Access Denied', message: 'Incorrect Security PIN.', headerColor: '#FCA5A5' }); return; }
                
                const { error } = await supabase.from('profiles').update({ 
                    full_name: newName, 
                    role: newRole, 
                    course: newCourse 
                }).eq('id', id);
                
                if (error) { 
                    window.showNeoModal({ title: 'Update Failed', message: error.message, headerColor: '#FCA5A5' });
                } else { 
                    await window.logSystemActivity('UPDATE', `Modified user profile for: ${newName}`); 
                    window.loadUsers(); 
                }
            }
        });
    });

    window.deleteUser = function (userId, userEmail) {
        window.showNeoModal({
            title: 'Security Authorization', icon: 'fa-solid fa-lock', message: `Enter the Admin PIN to permanently revoke access for <b>${userEmail}</b>.`,
            requireInput: true, inputType: 'password', inputPlaceholder: 'Enter 6-digit PIN', headerColor: '#FCA5A5', confirmColor: '#EF4444', confirmText: 'Verify & Revoke',
            onConfirm: async (pin) => {
                if (pin !== '123456') { window.showNeoModal({ title: 'Access Denied', message: 'Incorrect PIN.', headerColor: '#FCA5A5' }); return; }
                const { error } = await supabase.rpc('delete_user_account', { target_user_id: userId });
                if (error) { window.showNeoModal({ title: 'Deletion Failed', message: error.message, headerColor: '#FCA5A5' }); return; }
                await window.logSystemActivity('DELETE', `Revoked system access for: ${userEmail}`);
                window.loadUsers();
            }
        });
    };

    window.loadUsers();
});