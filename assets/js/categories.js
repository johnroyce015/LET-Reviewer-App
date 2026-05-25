const supabase = window.supabaseClient;

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

    // 2. Fetch Categories
    fetchLiveCategories();
});

async function fetchLiveCategories() {
    const container = document.getElementById('categoryContainer');
    
    const addCardHTML = `
        <div class="add-category-card" onclick="window.location.href='bulk-upload.html'">
            <div class="add-icon"><i class="fa-solid fa-plus"></i></div>
            <h3>Add Data</h3>
            <p>Upload a new CSV to populate categories.</p>
        </div>
    `;

    const { data: categories, error } = await supabase.from('categories').select('*');

    if (error) {
        container.innerHTML = `<div style="color: red;">Error: ${error.message}</div>${addCardHTML}`;
        return;
    }

    container.innerHTML = ''; 

    const themeColors = ['purple', 'yellow', 'green'];

    categories.forEach((cat, index) => {
        const colorClass = themeColors[index % themeColors.length];

        const card = document.createElement('div');
        card.className = `category-card ${colorClass}`;
        card.innerHTML = `
            <div class="category-top">
                <div class="category-status"><div class="status-dot"></div> Active</div>
                <div class="category-card-actions">
                    <button class="category-action-btn" onclick="deleteCategory(${cat.id})"><i class="fa-solid fa-trash" style="color: #EF4444;"></i></button>
                </div>
            </div>
            <h2 class="category-name">${cat.category_name}</h2>
            <div class="category-code">ID: ${cat.id}</div>
            <p class="category-description">Review materials specifically curated for ${cat.category_name}.</p>
            <div class="category-footer">
                <span class="category-items">Status: Live</span>
                <span class="view-details">Manage <i class="fa-solid fa-arrow-right"></i></span>
            </div>
        `;
        container.appendChild(card);
    });

    container.innerHTML += addCardHTML;
}

// Delete Functionality
window.deleteCategory = async function(id) {
    window.showNeoModal({
        title: 'Confirm Deletion',
        icon: 'fa-solid fa-trash',
        message: 'Are you sure you want to delete this category? Ensure no questions are currently linked to it!',
        headerColor: '#FDE68A',
        confirmColor: '#EF4444',
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if(!error) {
                fetchLiveCategories(); 
            } else {
                alert("Error deleting: " + error.message);
            }
        }
    });
};