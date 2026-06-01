var supabase = window.supabaseClient;

// State Variables
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {}; // Stores answers like { "0": "A", "1": "C" }
let timerInterval;
let timeLeft = 3600; // 60 minutes in seconds

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. VIP Bouncer
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '../login.html'; return; }

    // 2. What subject did they click?
    const category = localStorage.getItem('activeQuizCategory');
    if (!category) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    document.getElementById('quizCategoryLabel').textContent = category;

    // 3. Setup Buttons
    document.getElementById('quitQuizBtn').addEventListener('click', confirmQuit);
    document.getElementById('nextBtn').addEventListener('click', handleNext);
    document.getElementById('prevBtn').addEventListener('click', handlePrev);

    // 4. Fetch the questions!
    fetchQuestions(category);
});

async function fetchQuestions(categoryName) {
    document.getElementById('questionText').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching questions...';

    const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category', categoryName);

    if (error || !questions || questions.length === 0) {
        document.getElementById('questionText').textContent = "No questions found for this category yet!";
        document.getElementById('nextBtn').style.display = 'none';
        return;
    }

    // Shuffle the array so it's a real mock exam experience
    currentQuestions = questions.sort(() => Math.random() - 0.5);
    
    // Start the exam!
    startTimer();
    renderQuestion();
}

function renderQuestion() {
    const question = currentQuestions[currentIndex];
    
    document.getElementById('questionCounter').textContent = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
    document.getElementById('questionText').textContent = question.question_text;
    
    // Update Progress Bar
    const progressPercent = ((currentIndex) / currentQuestions.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;

    // Render Options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = ''; // Clear old options

    const options = [
        { letter: 'A', text: question.option_a },
        { letter: 'B', text: question.option_b },
        { letter: 'C', text: question.option_c },
        { letter: 'D', text: question.option_d }
    ];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        
        // If they already selected this answer before going 'back', highlight it!
        if (userAnswers[currentIndex] === opt.letter) {
            btn.classList.add('selected');
        }

        btn.innerHTML = `<span class="option-letter">${opt.letter}</span> ${opt.text}`;
        btn.onclick = () => selectOption(opt.letter);
        optionsContainer.appendChild(btn);
    });

    // Toggle Prev/Next buttons
    document.getElementById('prevBtn').style.display = currentIndex === 0 ? 'none' : 'block';
    
    const nextBtn = document.getElementById('nextBtn');
    if (currentIndex === currentQuestions.length - 1) {
        nextBtn.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> Submit Exam';
        nextBtn.style.background = '#10B981';
    } else {
        nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
        nextBtn.style.background = '#111827';
    }
}

function selectOption(letter) {
    userAnswers[currentIndex] = letter;
    renderQuestion(); // Re-render to highlight their choice
}

function handleNext() {
    // Force them to pick an answer
    if (!userAnswers[currentIndex]) {
        alert("Please select an answer before continuing.");
        return;
    }

    if (currentIndex === currentQuestions.length - 1) {
        confirmSubmit();
    } else {
        currentIndex++;
        renderQuestion();
    }
}

function handlePrev() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

// --- SUBMIT AND GRADE ---

function confirmSubmit() {
    window.showNeoModal({
        title: 'Submit Exam?',
        icon: 'fa-solid fa-flag-checkered',
        message: 'Are you sure you are ready to submit your mock exam? You cannot change your answers after this.',
        confirmText: 'Yes, Grade It',
        cancelText: 'Cancel',
        onConfirm: gradeExam
    });
}

function confirmQuit() {
    window.showNeoModal({
        title: 'Quit Exam?',
        icon: 'fa-solid fa-triangle-exclamation',
        message: 'Are you sure you want to quit? Your progress will be lost.',
        headerColor: '#FCA5A5',
        confirmColor: '#EF4444',
        confirmText: 'Quit',
        cancelText: 'Stay',
        onConfirm: () => window.location.href = 'dashboard.html'
    });
}

function gradeExam() {
    clearInterval(timerInterval);
    
    let score = 0;
    let wrongAnswers = [];

    currentQuestions.forEach((q, index) => {
        const chosen = userAnswers[index];
        
        if (chosen === q.correct_answer) {
            score++;
        } else {
            // 🟢 NEW HELPER: Maps the letter ('A') to the object key ('option_a') to get the exact text
            const getOptionText = (letter) => {
                if (!letter) return 'Skipped';
                const key = `option_${letter.toLowerCase()}`;
                return `Option ${letter}: ${q[key]}`;
            };

            // Save the mistake with the full text so they can review it!
            wrongAnswers.push({
                question: q.question_text,
                userAnswer: getOptionText(chosen),
                correctAnswer: getOptionText(q.correct_answer)
            });
        }
    });

    // Save package for the results.html page to read
    const resultsPackage = {
        category: localStorage.getItem('activeQuizCategory'),
        score: score,
        total: currentQuestions.length,
        wrongAnswers: wrongAnswers
    };

    localStorage.setItem('letQuizResults', JSON.stringify(resultsPackage));
    window.location.href = 'results.html';
}

// --- TIMER LOGIC ---
function startTimer() {
    const display = document.getElementById('timerDisplay');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        // Add leading zero (e.g., 09:05)
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        
        display.innerHTML = `<i class="fa-solid fa-clock"></i> ${minutes}:${seconds}`;

        if (timeLeft <= 300) {
            display.style.backgroundColor = '#FEE2E2'; // Red warning at 5 minutes!
            display.style.color = '#EF4444';
            display.style.border = '2px solid #EF4444';
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Auto-submitting your exam.");
            gradeExam();
        }
    }, 1000);
}