var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VIP BOUNCER
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return;
    }

    fetchLiveCategories();
});

async function fetchLiveCategories() {
    const container = document.getElementById('categoryContainer');
    
    // Grab the blueprints from the HTML file
    const cardTemplate = document.getElementById('categoryCardTemplate');
    const addTemplate = document.getElementById('addCategoryTemplate');

    const { data: categories, error } = await supabase.from('categories').select('*');

    if (error) {
        container.textContent = `Error: ${error.message}`;
        return;
    }

    container.innerHTML = ''; 
    const themeColors = ['purple', 'yellow', 'green'];

    // Stamp out a card for every category in the database
    categories.forEach((cat, index) => {
        const colorClass = themeColors[index % themeColors.length];
        
        // Clone the HTML blueprint
        const clone = cardTemplate.content.cloneNode(true);
        
        // Add the color class to the main wrapper
        const cardWrapper = clone.querySelector('.category-card');
        cardWrapper.classList.add(colorClass);

        // Inject the exact database text (NO HTML written here!)
        clone.querySelector('.category-name').textContent = cat.category_name;
        clone.querySelector('.category-code').textContent = `ID: ${cat.id}`;
        clone.querySelector('.category-description').textContent = `Review materials specifically curated for ${cat.category_name}.`;

        // Wire up the buttons
        const deleteBtn = clone.querySelector('.category-action-btn');
        deleteBtn.onclick = () => deleteCategory(cat.id);

        const manageBtn = clone.querySelector('.view-details');
        manageBtn.onclick = () => window.location.href = 'questions.html';

        // Add the finished card to the screen
        container.appendChild(clone);
    });

    // Stamp out the "Add Data" card at the very end
    const addClone = addTemplate.content.cloneNode(true);
    const addWrapper = addClone.querySelector('.add-category-card');
    addWrapper.onclick = () => window.location.href = 'bulk-upload.html';
    container.appendChild(addClone);
}

window.deleteCategory = async function(id) {
    window.showNeoModal({
        title: 'Confirm Deletion',
        icon: 'fa-solid fa-trash',
        message: 'Are you sure you want to delete this category?',
        headerColor: '#FDE68A',
        confirmColor: '#EF4444',
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if(!error) { fetchLiveCategories(); } 
            else { window.showNeoModal({ title: 'Error', message: error.message, headerColor: '#FCA5A5' }); }
        }
    });
};