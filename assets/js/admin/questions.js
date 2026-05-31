var supabase = window.supabaseClient;
let allQuestions = []; 

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profileData || (profileData.role !== 'teacher' && profileData.role !== 'admin')) {
        window.location.href = 'index.html'; return; 
    }

document.body.style.visibility = 'visible';

    await fetchLiveQuestions();

    document.getElementById('searchInput').addEventListener('input', filterQuestions);
    document.getElementById('categoryFilter').addEventListener('change', filterQuestions);

    const editModal = document.getElementById('editQuestionModal');
    
    document.getElementById('cancelEditQBtn').addEventListener('click', () => { editModal.classList.add('hidden'); });

    document.getElementById('editQuestionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editQId').value;
        const qText = document.getElementById('editQText').value;
        
        const { error } = await supabase.from('questions').update({
            question_text: qText,
            option_a: document.getElementById('editOptA').value,
            option_b: document.getElementById('editOptB').value,
            option_c: document.getElementById('editOptC').value,
            option_d: document.getElementById('editOptD').value,
            correct_answer: document.getElementById('editQCorrect').value
        }).eq('id', id);

        if (error) {
            window.showNeoModal({ title: 'Update Failed', message: error.message, headerColor: '#FCA5A5' });
        } else {
            // 🔥 THE NEW TRACKER!
            await window.logSystemActivity('UPDATE', `Edited question ID #${id}`);

            editModal.classList.add('hidden');
            await fetchLiveQuestions(); 
        }
    });
});

async function fetchLiveQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '<div class="loading-state">Loading questions...</div>';
    
    const { data, error } = await supabase.from('questions').select('*').order('id', { ascending: false });
    if (error) { container.innerHTML = `<div class="loading-state">Error: ${error.message}</div>`; return; }

    allQuestions = data; 
    populateCategoryDropdown(); 
    filterQuestions(); 
}

function populateCategoryDropdown() {
    const filter = document.getElementById('categoryFilter');
    const uniqueCategories = [...new Set(allQuestions.map(q => q.category))].filter(Boolean);
    
    filter.innerHTML = '<option value="All">All Categories</option>';
    uniqueCategories.forEach(cat => { filter.innerHTML += `<option value="${cat}">${cat}</option>`; });
}

function filterQuestions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCat = document.getElementById('categoryFilter').value;

    const filtered = allQuestions.filter(q => {
        const matchesSearch = q.question_text.toLowerCase().includes(searchTerm);
        const matchesCat = selectedCat === 'All' || q.category === selectedCat;
        return matchesSearch && matchesCat;
    });

    renderQuestions(filtered);
}

function renderQuestions(questionsArray) {
    const container = document.getElementById('questionsContainer');
    if (questionsArray.length === 0) { container.innerHTML = `<div class="loading-state">No matching questions found.</div>`; return; }
    container.innerHTML = ''; 

    questionsArray.forEach(q => {
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
            <div class="action-buttons">
                <button class="action-btn edit-btn" onclick="openEditModal(${q.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteQuestion(${q.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.openEditModal = function(id) {
    const q = allQuestions.find(x => x.id === id);
    if (!q) return;

    document.getElementById('editQId').value = q.id;
    document.getElementById('editQText').value = q.question_text;
    document.getElementById('editOptA').value = q.option_a;
    document.getElementById('editOptB').value = q.option_b;
    document.getElementById('editOptC').value = q.option_c;
    document.getElementById('editOptD').value = q.option_d;
    document.getElementById('editQCorrect').value = q.correct_answer;
    document.getElementById('editQuestionModal').classList.remove('hidden');
};

window.deleteQuestion = async function(id) {
    window.showNeoModal({
        title: 'Confirm Deletion', icon: 'fa-solid fa-trash', message: 'Are you sure you want to delete this question?',
        headerColor: '#FDE68A', confirmColor: '#EF4444', confirmText: 'Yes, Delete', cancelText: 'Cancel',
        onConfirm: async () => {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if(!error) {
                // 🔥 THE NEW TRACKER!
                await window.logSystemActivity('DELETE', `Deleted a mock exam question`);
                fetchLiveQuestions(); 
            } else { window.showNeoModal({ title: 'Error', message: error.message, headerColor: '#FCA5A5' }); }
        }
    });
};