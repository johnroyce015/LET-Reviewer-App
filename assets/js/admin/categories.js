document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) { window.location.href = 'login.html'; return; }

    const { data: profileData } = await window.supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
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
            const newLevel = document.getElementById('newCategoryLevel').value; // NEW FIELD!

            const { error } = await window.supabaseClient.from('categories').insert([{ 
                category_name: newName,
                exam_level: newLevel 
            }]);

            if (error) {
                window.showNeoModal({ title: 'Creation Failed', message: error.message, headerColor: '#FCA5A5' });
            } else {
                await window.logSystemActivity('CREATE', `Created a new ${newLevel} category: ${newName}`);
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
            const newLevel = document.getElementById('editCategoryLevel').value; // NEW FIELD!

            const { error } = await window.supabaseClient.from('categories').update({ 
                category_name: newName,
                exam_level: newLevel
            }).eq('id', id);

            if (error) {
                window.showNeoModal({ title: 'Update Failed', message: error.message, headerColor: '#FCA5A5' });
            } else {
                await window.logSystemActivity('UPDATE', `Updated category: ${newName}`);
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

    const { data: categories, error } = await window.supabaseClient.from('categories').select('*').order('created_at', { ascending: true });

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
        
        // 🟢 THE NEW LEVEL BADGE (No more URL slug!)
        // If it somehow still says "Both" or is empty, we safely default it to Elementary
        const levelText = (cat.exam_level && cat.exam_level !== 'Both') ? cat.exam_level.toUpperCase() : 'ELEMENTARY';
        
        // Upgraded the badge styling to look like a standalone pill
        const levelBadge = `<span style="background: #111827; color: #FFF; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 10px; box-shadow: 2px 2px 0px rgba(0,0,0,0.3);">
            <i class="fa-solid fa-graduation-cap" style="margin-right: 4px;"></i> ${levelText}
        </span>`;
        
        // Injecting ONLY the Level Badge into the slot
        clone.querySelector('.category-uri-tag').innerHTML = levelBadge;
        
        clone.querySelector('.category-description').textContent = `Foundational materials and practice test vectors explicitly curated for comprehensive ${cat.category_name} review segments.`;

        const { count } = await window.supabaseClient.from('questions').select('*', { count: 'exact', head: true }).eq('category', cat.category_name);
        clone.querySelector('.count-slot').textContent = count || 0;

        clone.querySelector('.edit-card-square').onclick = () => {
            document.getElementById('editCategoryId').value = cat.id;
            document.getElementById('editCategoryName').value = cat.category_name;
            
            // Set the dropdown to strictly Elementary or Secondary
            document.getElementById('editCategoryLevel').value = cat.exam_level === 'Secondary' ? 'Secondary' : 'Elementary';
            
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
            if (pin !== '123456') {
                window.showNeoModal({ title: 'Access Denied', icon: 'fa-solid fa-triangle-exclamation', message: 'Incorrect Security PIN. Action aborted.', headerColor: '#FCA5A5' });
                return;
            }
            const { error } = await window.supabaseClient.from('categories').delete().eq('id', id);
            if(!error) { 
                await window.logSystemActivity('DELETE', `Permanently deleted the category: ${categoryName}`);
                fetchLiveCategories(); 
            } else { 
                window.showNeoModal({ title: 'Error', message: error.message, headerColor: '#FCA5A5' }); 
            }
        }
    });
};