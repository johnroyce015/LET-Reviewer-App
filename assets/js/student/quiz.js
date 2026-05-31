document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const elements = {
        loading: document.getElementById('loadingState'),
        content: document.getElementById('quizContent'),
        questionText: document.getElementById('questionText'),
        optionsContainer: document.getElementById('optionsContainer'),
        questionCounter: document.getElementById('questionCounter'),
        nextBtn: document.getElementById('nextBtn'),
        prevBtn: document.getElementById('prevBtn'),
        exitBtn: document.getElementById('exitQuizBtn'),
        networkStatus: document.getElementById('networkStatus')
    };

    // State Variables
    let questions = [];
    let currentIndex = 0;
    let userAnswers = {};

    // 1. Setup Network Listeners
    const updateNetworkUI = () => {
        if (navigator.onLine) {
            elements.networkStatus.className = 'network-badge badge-online';
            elements.networkStatus.innerHTML = '<i class="fa-solid fa-wifi"></i>';
        } else {
            elements.networkStatus.className = 'network-badge badge-offline';
            elements.networkStatus.innerHTML = '<i class="fa-solid fa-plane"></i>';
        }
    };
    window.addEventListener('online', updateNetworkUI);
    window.addEventListener('offline', updateNetworkUI);
    updateNetworkUI();

    // 2. Fetch Questions
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');

    if (!categoryId) {
        alert("Invalid subject selected.");
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        questions = await window.OfflineSync.syncQuestions(categoryId);
        
        if (questions.length === 0) {
            elements.loading.innerHTML = 'No questions available for this subject yet.';
            return;
        }

        // Hide loading, show content
        elements.loading.classList.add('hidden');
        elements.content.classList.remove('hidden');
        
        loadQuestion(currentIndex);
    } catch (err) {
        console.error(err);
        elements.loading.innerHTML = 'Failed to load questions.';
    }

    // 3. Render Question
    function loadQuestion(index) {
        const question = questions[index];
        elements.questionCounter.textContent = `Question ${index + 1} of ${questions.length}`;
        elements.questionText.textContent = question.question_text; // Adjust matching your DB column names
        
        elements.optionsContainer.innerHTML = '';
        
        // Assuming your DB has options stored as option_a, option_b, etc.
        const options = [
            { id: 'A', text: question.option_a },
            { id: 'B', text: question.option_b },
            { id: 'C', text: question.option_c },
            { id: 'D', text: question.option_d }
        ];

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${opt.id}. ${opt.text}`;
            
            // Re-apply selected class if user previously answered this
            if (userAnswers[index] === opt.id) {
                btn.classList.add('selected');
                elements.nextBtn.disabled = false;
            }

            btn.addEventListener('click', () => selectOption(btn, opt.id));
            elements.optionsContainer.appendChild(btn);
        });

        // Button states
        elements.prevBtn.classList.toggle('hidden', index === 0);
        
        if (index === questions.length - 1) {
            elements.nextBtn.textContent = 'Submit Exam';
        } else {
            elements.nextBtn.textContent = 'Next Question';
        }

        // Disable next if no answer selected yet
        if (!userAnswers[index]) {
            elements.nextBtn.disabled = true;
        }
    }

    // 4. Handle Option Selection
    function selectOption(clickedBtn, optionId) {
        // Remove selected class from all buttons
        const allBtns = elements.optionsContainer.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.classList.remove('selected'));
        
        // Add to clicked button
        clickedBtn.classList.add('selected');
        
        // Save answer and enable next button
        userAnswers[currentIndex] = optionId;
        elements.nextBtn.disabled = false;
    }

    // 5. Event Listeners for Navigation
    elements.nextBtn.addEventListener('click', () => {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            loadQuestion(currentIndex);
        } else {
            submitExam();
        }
    });

    elements.prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            loadQuestion(currentIndex);
        }
    });

    elements.exitBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
            window.location.href = 'dashboard.html';
        }
    });

    // 6. Submit Logic
    function submitExam() {
        // Calculate Score
        let score = 0;
        questions.forEach((q, index) => {
            if (userAnswers[index] === q.correct_answer) { // Adjust 'correct_answer' to your DB column name
                score++;
            }
        });

        // Save data to localStorage to pass to results.html
        const resultData = {
            score: score,
            total: questions.length,
            categoryId: categoryId
        };
        localStorage.setItem('recent_quiz_result', JSON.stringify(resultData));
        
        // Redirect
        window.location.href = 'results.html';
    }
});