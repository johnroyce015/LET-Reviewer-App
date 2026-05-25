// Initialize Supabase
const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    fetchLiveCategories();
});

async function fetchLiveCategories() {
    const container = document.getElementById('categoryContainer');
    
    // 1. Save the "Add Category" card HTML so we don't overwrite it
    const addCardHTML = `
        <div class="add-category-card" onclick="window.location.href='bulk-upload.html'">
            <div class="add-icon"><i class="fa-solid fa-plus"></i></div>
            <h3>Add Data</h3>
            <p>Upload a new CSV to populate categories.</p>
        </div>
    `;

    // 2. Fetch data from Supabase
    const { data: categories, error } = await supabase.from('categories').select('*');

    if (error) {
        container.innerHTML = `<div style="color: red;">Error: ${error.message}</div>${addCardHTML}`;
        return;
    }

    container.innerHTML = ''; // Clear loading text

    // 3. Array of CSS color classes to cycle through
    const themeColors = ['purple', 'yellow', 'green'];

    // 4. Loop through database and build cards
    categories.forEach((cat, index) => {
        // Cycle colors so they don't all look identical
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

    // 5. Append the "Add Category" card at the very end
    container.innerHTML += addCardHTML;
}

// Delete Functionality
window.deleteCategory = async function(id) {
    if(confirm("Delete this category? (Note: Ensure no questions are currently linked to it!)")) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if(!error) {
            fetchLiveCategories(); // Refresh grid
        } else {
            alert("Error deleting: " + error.message);
        }
    }
};