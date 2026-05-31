// ==========================================
// OFFLINE DATA SYNC MANAGER
// ==========================================
window.OfflineSync = {
    
    // 1. Download and save Categories
    syncCategories: async function() {
        if (!navigator.onLine) {
            console.log("📴 Offline: Loading categories from local storage.");
            return JSON.parse(localStorage.getItem('let_categories')) || [];
        }

        try {
            console.log("🟢 Online: Fetching latest categories from Supabase...");
            const { data, error } = await window.supabaseClient.from('categories').select('*');
            
            if (error) throw error;

            // Save to phone storage
            localStorage.setItem('let_categories', JSON.stringify(data));
            return data;
        } catch (err) {
            console.error("❌ Failed to sync categories:", err);
            // Fallback to local storage if Supabase fails
            return JSON.parse(localStorage.getItem('let_categories')) || [];
        }
    },

    // 2. Download and save Questions for a specific Category
    syncQuestions: async function(categoryId) {
        const storageKey = `let_questions_${categoryId}`;

        if (!navigator.onLine) {
            console.log(`📴 Offline: Loading questions for category ${categoryId}.`);
            return JSON.parse(localStorage.getItem(storageKey)) || [];
        }

        try {
            console.log(`🟢 Online: Fetching latest questions for category ${categoryId}...`);
            const { data, error } = await window.supabaseClient
                .from('questions')
                .select('*')
                .eq('category_id', categoryId);
            
            if (error) throw error;

            // Save to phone storage
            localStorage.setItem(storageKey, JSON.stringify(data));
            return data;
        } catch (err) {
            console.error("❌ Failed to sync questions:", err);
            return JSON.parse(localStorage.getItem(storageKey)) || [];
        }
    }
};