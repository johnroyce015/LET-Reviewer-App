var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return;
    }

document.body.style.visibility = 'visible';

    // --- ADD CATEGORY LOGIC ---
    const addModal = document.getElementById('addCategoryModal');
    if (addModal) {
        document.getElementById('cancelAddCategoryBtn').addEventListener('click', () => {
            addModal.classList.add('hidden');
            document.getElementById('addCategoryForm').reset(); 
        });

        document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('newCategoryName').value;

            const { error } = await supabase.from('categories').insert([{ category_name: newName }]);

            if (error) {
                window.showNeoModal({ title: 'Creation Failed', message: error.message, headerColor: '#FCA5A5' });
            } else {
                // 🔥 THE NEW TRACKER!
                await window.logSystemActivity('CREATE', `Created a new category: ${newName}`);
                
                addModal.classList.add('hidden');
                document.getElementById('addCategoryForm').reset();
                fetchLiveCategories(); 
            }
        });
    }

    // --- EDIT CATEGORY LOGIC ---
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
                window.showNeoModal({ title: 'Update Failed', message: error.message, headerColor: '#FCA5A5' });
            } else {
                // 🔥 THE NEW TRACKER!
                await window.logSystemActivity('UPDATE', `Renamed a category to: ${newName}`);

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

    if (error) { container.textContent = `Error: ${error.message}`; return; }
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

        const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('category', cat.category_name);
        clone.querySelector('.count-slot').textContent = count || 0;

        clone.querySelector('.edit-card-square').onclick = () => {
            document.getElementById('editCategoryId').value = cat.id;
            document.getElementById('editCategoryName').value = cat.category_name;
            document.getElementById('editCategoryModal').classList.remove('hidden');
        };

        clone.querySelector('.delete-card-square').onclick = () => deleteCategory(cat.id, cat.category_name);
        container.appendChild(clone);
    }

    if (addTemplate) {
        const addClone = addTemplate.content.cloneNode(true);
        addClone.querySelector('.add-category-card').onclick = () => { document.getElementById('addCategoryModal').classList.remove('hidden'); };
        container.appendChild(addClone);
    }
}

// SECURE DELETE FUNCTION (WITH PIN CONFIRMATION)
window.deleteCategory = async function(id, categoryName) {
    window.showNeoModal({
        title: 'Security Authorization',
        icon: 'fa-solid fa-lock',
        message: `Enter the Admin PIN to delete the category <b>${categoryName}</b>.`,
        requireInput: true,
        inputType: 'password',
        inputPlaceholder: 'Enter 6-digit PIN',
        headerColor: '#FDE68A',
        confirmColor: '#EF4444',
        confirmText: 'Verify & Delete',
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
            const { error } = await supabase.from('categories').delete().eq('id', id);
            
            if(!error) { 
                await window.logSystemActivity('DELETE', `Permanently deleted the category: ${categoryName}`);
                fetchLiveCategories(); 
            } 
            else { 
                window.showNeoModal({ title: 'Error', message: error.message, headerColor: '#FCA5A5' }); 
            }
        }
    });
};