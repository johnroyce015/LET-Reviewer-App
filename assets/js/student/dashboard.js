var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. VIP BOUNCER: Ensure the user is logged in
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { 
        window.location.href = '../login.html'; 
        return; 
    }

    // Reveal the page once security passes
    document.body.style.visibility = 'visible';

    // 2. Fetch the review materials
    loadAvailableQuizzes();
});

async function loadAvailableQuizzes() {
    // Make sure you have a div with id="quizContainer" in your dashboard.html!
    const container = document.getElementById('quizContainer'); 
    
    if (!container) return;
    container.innerHTML = '<div class="loading">Fetching review modules...</div>';

    // Grab all categories from the database
    const { data: categories, error } = await supabase.from('categories').select('*');

    if (error) {
        container.innerHTML = `<div class="error">Failed to load modules: ${error.message}</div>`;
        return;
    }

    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="empty">No review materials available right now. Check back later!</div>';
        return;
    }

    container.innerHTML = ''; // Clear the loading message

    // Generate a card for every category
    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'quiz-card'; // Make sure you style this class in your CSS!
        
        card.innerHTML = `
            <h3>${cat.category_name}</h3>
            <p><strong>Level:</strong> ${cat.level ? cat.level.toUpperCase() : 'General'}</p>
            <button class="btn-start" onclick="startQuiz('${cat.category_name}')">
                <i class="fa-solid fa-play"></i> Start Review
            </button>
        `;
        container.appendChild(card);
    });
}

// 3. The Bridge to the Quiz Page
window.startQuiz = function(categoryName) {
    // We save their choice to the browser's memory so quiz.html knows what to load!
    localStorage.setItem('activeQuizCategory', categoryName);
    window.location.href = 'quiz.html';
};