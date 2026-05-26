var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. THE VIP BOUNCER: Check session AND role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        window.location.href = 'login.html';
        return; 
    }

    // FETCH THE PROFILE DATA (This was missing!)
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    // If they aren't a teacher or admin, kick them out!
    if (profileError || !profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.showNeoModal({
            title: 'Access Denied',
            icon: 'fa-solid fa-hand',
            message: 'You are signed in as a Student. You do not have permission to access the Teacher Admin Panel.',
            headerColor: '#FCA5A5', 
            confirmColor: '#EF4444', 
            confirmText: 'Return to Homepage',
            onConfirm: async () => {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            }
        });
        return; 
    }

    // 2. Fetch Questions
    fetchLiveQuestions();
});

async function fetchLiveQuestions() {
    const container = document.getElementById('questionsContainer');
    
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

    container.innerHTML = ''; 

    questions.forEach(q => {
        const isA = q.correct_answer === 'A' ? 'correct' : '';
        const isB = q.correct_answer === 'B' ? 'correct' : '';
        const isC = q.correct_answer === 'C' ? 'correct' : '';
        const isD = q.correct_answer === 'D' ? 'correct' : '';

        let catColor = 'math'; 
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

// Delete Functionality (Now using your custom Modal!)
window.deleteQuestion = async function(id) {
    window.showNeoModal({
        title: 'Confirm Deletion',
        icon: 'fa-solid fa-trash',
        message: 'Are you sure you want to permanently delete this question?',
        headerColor: '#FDE68A',
        confirmColor: '#EF4444',
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if(!error) {
                fetchLiveQuestions(); 
            } else {
                alert("Error deleting: " + error.message);
            }
        }
    });
};