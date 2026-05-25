// Initialize Supabase
const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    fetchLiveUsers();
});

async function fetchLiveUsers() {
    const container = document.getElementById('usersContainer');
    
    // Fetch data from the profiles table
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        container.innerHTML = `<div style="color: red; padding: 20px;">Error loading users: ${error.message}</div>`;
        return;
    }

    if (users.length === 0) {
        container.innerHTML = `<div style="padding: 20px; font-weight: bold;">No users found in the system yet.</div>`;
        return;
    }

    container.innerHTML = ''; // Clear loading text

    // Loop through the database rows and create HTML user cards
    users.forEach(user => {
        
        // 1. Determine Badge Styling based on Role
        let roleBadge = '';
        let streakBadge = '';
        
        if (user.role && user.role.toLowerCase() === 'teacher') {
            roleBadge = `<span class="role-badge teacher-role">Teacher / Admin</span>`;
            // Teachers don't get streaks, so we just show their join date or a placeholder
            streakBadge = `<span class="joined-date">Verified Instructor</span>`;
        } else {
            roleBadge = `<span class="role-badge student-role">Student</span>`;
            // Students get the streak badge
            const currentStreak = user.streak || 0;
            streakBadge = `<span class="score-badge"><i class="fa-solid fa-fire" style="color: #F59E0B;"></i> ${currentStreak} Day Streak</span>`;
        }

        // 2. Generate an Avatar dynamically using their name
        const encodedName = encodeURIComponent(user.full_name || 'Unknown User');
        // Give teachers purple avatars, students yellow ones
        const avatarBg = (user.role && user.role.toLowerCase() === 'teacher') ? 'C4B5FD' : 'FDE68A';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=${avatarBg}&color=111827&bold=true`;

        // 3. Build the actual card HTML
        const card = document.createElement('div');
        card.className = 'user-card';
        card.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
        
        card.innerHTML = `
            <div class="user-left">
                <div class="user-avatar"><img src="${avatarUrl}" alt="${user.full_name}"></div>
                <div class="user-info">
                    <h2>${user.full_name || 'Unknown'}</h2>
                    <p>${user.email || 'No email provided'}</p>
                </div>
            </div>
            <div class="user-right">
                ${roleBadge}
                ${streakBadge}
                <button class="user-menu-btn" onclick="deleteUser(${user.id})" title="Remove User">
                    <i class="fa-solid fa-trash" style="color: #EF4444;"></i>
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Temporary Delete Function for Admin purposes
window.deleteUser = async function(id) {
    if(confirm("Are you sure you want to remove this user profile from the database?")) {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if(!error) {
            fetchLiveUsers(); // Refresh the grid
        } else {
            alert("Error deleting user: " + error.message);
        }
    }
};