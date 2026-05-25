// Initialize Supabase
const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    fetchLiveQuestions();
});

async function fetchLiveQuestions() {
    const container = document.getElementById('questionsContainer');
    
    // Fetch newest questions first
    const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        container.innerHTML = `<div style="color: red; padding: 20px;">Error loading questions: ${error.message}</div>`;
        return;
    }

    if (questions.length === 0) {
        container.innerHTML = `<div style="padding: 20px; font-weight: bold;">No questions found. Time to upload some!</div>`;
        return;
    }

    container.innerHTML = ''; // Clear loading text

    // Loop through and build the UI cards
    questions.forEach(q => {
        // Determine which bubble gets the "correct" styling
        const isA = q.correct_answer === 'A' ? 'correct' : '';
        const isB = q.correct_answer === 'B' ? 'correct' : '';
        const isC = q.correct_answer === 'C' ? 'correct' : '';
        const isD = q.correct_answer === 'D' ? 'correct' : '';

        // Assign category badge color dynamically
        let catColor = 'math'; // Default yellow
        if (q.category && q.category.toLowerCase().includes('general')) catColor = 'math';
        if (q.category && q.category.toLowerCase().includes('professional')) catColor = 'science';
        if (q.category && q.category.toLowerCase().includes('major')) catColor = 'english';

        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <div class="question-info">
                <h3>${q.question_text}</h3>
                <div class="question-choices">
                    <span class="choice ${isA}">A. ${q.option_a}</span>
                    <span class="choice ${isB}">B. ${q.option_b}</span>
                    <span class="choice ${isC}">C. ${q.option_c}</span>
                    <span class="choice ${isD}">D. ${q.option_d}</span>
                </div>
            </div>
            <div><span class="category-badge ${catColor}">${q.category}</span></div>
            <div><span class="difficulty-badge medium">Standard</span></div>
            <div style="font-weight: 700; color: #10B981;">Active</div>
            <div class="action-buttons">
                <button class="action-btn" onclick="deleteQuestion(${q.id})" style="color: #EF4444;" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Delete Functionality
window.deleteQuestion = async function(id) {
    if(confirm("Are you sure you want to permanently delete this question?")) {
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if(!error) {
            fetchLiveQuestions(); // Refresh the list
        } else {
            alert("Error deleting: " + error.message);
        }
    }
};