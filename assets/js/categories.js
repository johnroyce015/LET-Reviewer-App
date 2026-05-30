var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VIP BOUNCER
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return;
    }

    // 2. SETUP ADD MODAL LOGIC
    const addModal = document.getElementById('addCategoryModal');
    if (addModal) {
        document.getElementById('cancelAddCategoryBtn').addEventListener('click', () => {
            addModal.classList.add('hidden');
            document.getElementById('addCategoryForm').reset(); // Clear the input
        });

        document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('newCategoryName').value;

            // Send the new category to Supabase
            const { error } = await supabase.from('categories').insert([{ category_name: newName }]);

            if (error) {
                window.showNeoModal({ title: 'Creation Failed', icon: 'fa-solid fa-triangle-exclamation', message: error.message, headerColor: '#FCA5A5', confirmColor: '#EF4444' });
            } else {
                addModal.classList.add('hidden');
                document.getElementById('addCategoryForm').reset();
                fetchLiveCategories(); // Refresh the grid instantly!
            }
        });
    }

    // 3. SETUP EDIT MODAL LOGIC
    const editModal = document.getElementById('editCategoryModal');
    if (editModal) {
        document.getElementById('cancelEditCategoryBtn').addEventListener('click', () => {
            editModal.classList.add('hidden');
        });

        document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editCategoryId').value;
            const newName = document.getElementById('editCategoryName').value;

            const { error } = await supabase.from('categories').update({ category_name: newName }).eq('id', id);

            if (error) {
                window.showNeoModal({ title: 'Update Failed', icon: 'fa-solid fa-triangle-exclamation', message: error.message, headerColor: '#FCA5A5', confirmColor: '#EF4444' });
            } else {
                editModal.classList.add('hidden');
                fetchLiveCategories(); 
            }
        });
    }

    fetchLiveCategories();
});

async function fetchLiveCategories() {
    const container = document.getElementById('categoryContainer');
    const cardTemplate = document.getElementById('categoryCardTemplate');
    const addTemplate = document.getElementById('addCategoryTemplate');

    const { data: categories, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });

    if (error) {
        container.textContent = `Error loading items: ${error.message}`;
        return;
    }

    container.innerHTML = ''; 
    const themeClasses = ['theme-purple', 'theme-yellow', 'theme-green', 'theme-red']; 

    for (let index = 0; index < categories.length; index++) {
        const cat = categories[index];
        const currentTheme = themeClasses[index % themeClasses.length];
        const clone = cardTemplate.content.cloneNode(true);
        
        const cardWrapper = clone.querySelector('.category-card');
        cardWrapper.classList.add(currentTheme);

        clone.querySelector('.category-name').textContent = cat.category_name;
        
        const URLSlug = cat.category_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        clone.querySelector('.category-uri-tag').textContent = `/${URLSlug}`;
        
        clone.querySelector('.category-description').textContent = `Foundational materials and practice test vectors explicitly curated for comprehensive ${cat.category_name} review segments.`;

        // The live count from questions table
        const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('category', cat.category_name);

        clone.querySelector('.count-slot').textContent = count || 0;

        // Edit button logic
        clone.querySelector('.edit-card-square').onclick = () => {
            document.getElementById('editCategoryId').value = cat.id;
            document.getElementById('editCategoryName').value = cat.category_name;
            document.getElementById('editCategoryModal').classList.remove('hidden');
        };

        // Delete button logic
        clone.querySelector('.delete-card-square').onclick = () => deleteCategory(cat.id, cat.category_name);
        
        container.appendChild(clone);
    }

    // Append dotted placeholder and wire it to the ADD MODAL!
    if (addTemplate) {
        const addClone = addTemplate.content.cloneNode(true);
        const addTarget = addClone.querySelector('.add-category-card');
        
        addTarget.onclick = () => { 
            document.getElementById('addCategoryModal').classList.remove('hidden'); 
        };
        
        container.appendChild(addClone);
    }
}

window.deleteCategory = async function(id, categoryName) {
    window.showNeoModal({
        title: 'Confirm Deletion',
        icon: 'fa-solid fa-trash',
        message: `Are you sure you want to delete the category <b>${categoryName}</b>?`,
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