var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VIP BOUNCER
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return;
    }

    // Bind layout helper modal logic to header secondary action
    const newCatBtn = document.getElementById('newCategoryActionBtn');
    if(newCatBtn) {
        newCatBtn.addEventListener('click', () => triggerComingSoonModal());
    }

    fetchLiveCategories();
});

async function fetchLiveCategories() {
    const container = document.getElementById('categoryContainer');
    const cardTemplate = document.getElementById('categoryCardTemplate');
    const addTemplate = document.getElementById('addCategoryTemplate');

    const { data: categories, error } = await supabase.from('categories').select('*');

    if (error) {
        container.textContent = `Error loading items: ${error.message}`;
        return;
    }

    container.innerHTML = ''; 
    
    // Instead of raw colors, we assign the CSS classes we built in categories.css!
    const themeClasses = ['theme-purple', 'theme-yellow', 'theme-green', 'theme-red']; 

    categories.forEach((cat, index) => {
        const currentTheme = themeClasses[index % themeClasses.length];
        const clone = cardTemplate.content.cloneNode(true);
        
        // Add the color class from the CSS file
        const cardWrapper = clone.querySelector('.category-card');
        cardWrapper.classList.add(currentTheme);

        // Clean value assignment (Pure textNode isolation)
        clone.querySelector('.category-name').textContent = cat.category_name;
        
        // Dynamically compute URI matching mockup labels (e.g., /gen-ed)
        const URLSlug = cat.category_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        clone.querySelector('.category-uri-tag').textContent = `/${URLSlug}`;
        
        clone.querySelector('.category-description').textContent = `Foundational materials and practice test vectors explicitly curated for comprehensive ${cat.category_name} review segments.`;

        // Mock counts mapped gracefully to prevent flat text layouts
        const sampleMockCounts = ['1,240', '850', '420', '110'];
        clone.querySelector('.count-slot').textContent = sampleMockCounts[index % sampleMockCounts.length];

        // Action bindings
        clone.querySelector('.edit-card-square').onclick = () => triggerComingSoonModal();
        clone.querySelector('.delete-card-square').onclick = () => deleteCategory(cat.id);
        
        // Details split redirect
        const triggerDetails = clone.querySelector('.view-details');
        triggerDetails.onclick = () => { window.location.href = 'questions.html'; };

        container.appendChild(clone);
    });

    // Append beautiful dotted placeholder matching final element slots
    const addClone = addTemplate.content.cloneNode(true);
    const addTarget = addClone.querySelector('.add-category-card');
    addTarget.onclick = () => { window.location.href = 'bulk-upload.html'; };
    container.appendChild(addClone);
}

function triggerComingSoonModal() {
    window.showNeoModal({
        title: 'Feature Module',
        icon: 'fa-solid fa-screwdriver-wrench',
        message: 'This inline modifier form option is being wired up. For now, please use the Bulk Upload suite tool!',
        headerColor: '#C4B5FD',
        confirmColor: '#111827'
    });
}

window.deleteCategory = async function(id) {
    window.showNeoModal({
        title: 'Confirm Deletion',
        icon: 'fa-solid fa-trash',
        message: 'Are you sure you want to delete this category card? This action cannot be undone.',
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