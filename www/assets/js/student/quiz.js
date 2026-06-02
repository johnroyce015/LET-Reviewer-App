// State Variables
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {}; // Stores answers like { "0": "A", "1": "C" }
let timerInterval;
let timeLeft = 3600; // 60 minutes in seconds
var supabase = null; // Guarded global declaration

document.addEventListener('DOMContentLoaded', async () => {
    
    // 💡 THE TIMING FIX: Safely grab the client now that deferred scripts are executed
    supabase = window.supabaseClient;
    if (!supabase) {
        console.error("Database initialization failed. Verify script order.");
        document.getElementById('questionText').textContent = "Configuration Error: Database connection failed.";
        return;
    }

    // 1. VIP Bouncer
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '../login.html'; return; }

    // 🔄 2. STATE RECOVERY: Check if they clicked "Continue Quiz" from the dashboard
    const shouldResume = localStorage.getItem('resumeQuizMode');
    const cachedSession = localStorage.getItem('activeQuizState');

    if (shouldResume === 'true' && cachedSession) {
        try {
            const restoredState = JSON.parse(cachedSession);
            
            currentQuestions = restoredState.currentQuestions;
            currentIndex = restoredState.currentIndex;
            userAnswers = restoredState.userAnswers;
            timeLeft = restoredState.timeLeft;

            // Consume temporary navigation session routing token
            localStorage.removeItem('resumeQuizMode');

            document.getElementById('quizCategoryLabel').textContent = restoredState.category;

            // Wire up handlers
            document.getElementById('quitQuizBtn').addEventListener('click', confirmQuit);
            document.getElementById('nextBtn').addEventListener('click', handleNext);
            document.getElementById('prevBtn').addEventListener('click', handlePrev);

            startTimer();
            renderQuestion();
            return; // Exit early to bypass running a fresh fetch
        } catch (err) {
            console.error("State recovery corrupted, clearing tokens:", err);
            localStorage.removeItem('activeQuizState');
        }
    }

    // 3. What subject did they click? Fresh Run Route
    const category = localStorage.getItem('activeQuizCategory');
    if (!category) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    document.getElementById('quizCategoryLabel').textContent = category;

    // 4. Setup Buttons
    document.getElementById('quitQuizBtn').addEventListener('click', confirmQuit);
    document.getElementById('nextBtn').addEventListener('click', handleNext);
    document.getElementById('prevBtn').addEventListener('click', handlePrev);

    // 5. Fetch the questions!
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

    // Shuffle array elements for randomized mock testing
    currentQuestions = questions.sort(() => Math.random() - 0.5);
    
    startTimer();
    renderQuestion();
}

function renderQuestion() {
    const question = currentQuestions[currentIndex];
    if (!question) return;
    
    document.getElementById('questionCounter').textContent = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
    document.getElementById('questionText').textContent = question.question_text;
    
    // Update Progress Bar
    const progressPercent = ((currentIndex) / currentQuestions.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;

    // Render Options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const options = [
        { letter: 'A', text: question.option_a },
        { letter: 'B', text: question.option_b },
        { letter: 'C', text: question.option_c },
        { letter: 'D', text: question.option_d }
    ];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        
        if (userAnswers[currentIndex] === opt.letter) {
            btn.classList.add('selected');
        }

        btn.innerHTML = `<span class="option-letter">${opt.letter}</span> ${opt.text}`;
        btn.onclick = () => selectOption(opt.letter);
        optionsContainer.appendChild(btn);
    });

    document.getElementById('prevBtn').style.display = currentIndex === 0 ? 'none' : 'block';
    
    const nextBtn = document.getElementById('nextBtn');
    if (currentIndex === currentQuestions.length - 1) {
        nextBtn.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> Submit Exam';
        nextBtn.style.background = '#10B981';
    } else {
        nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
        nextBtn.style.background = '#111827';
    }

    // 💾 BACKGROUND AUTO-SNAPSHOT: Background save tracking params for dashboard resume hooks
    const midSessionSnapshot = {
        category: localStorage.getItem('activeQuizCategory'),
        currentQuestions: currentQuestions,
        currentIndex: currentIndex,
        userAnswers: userAnswers,
        timeLeft: timeLeft
    };
    localStorage.setItem('activeQuizState', JSON.stringify(midSessionSnapshot));
}

function selectOption(letter) {
    userAnswers[currentIndex] = letter;
    renderQuestion();
}

function handleNext() {
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
        onConfirm: () => {
            localStorage.removeItem('activeQuizState'); // Wipe cache if quitting explicitly
            window.location.href = 'dashboard.html';
        }
    });
}

async function gradeExam() {
    clearInterval(timerInterval);
    
    let score = 0;
    let wrongAnswers = [];

    currentQuestions.forEach((q, index) => {
        const chosen = userAnswers[index];
        if (chosen === q.correct_answer) {
            score++;
        } else {
            const getOptionText = (letter) => {
                if (!letter) return 'Skipped';
                const key = `option_${letter.toLowerCase()}`;
                return `Option ${letter}: ${q[key]}`;
            };

            wrongAnswers.push({
                question: q.question_text,
                userAnswer: getOptionText(chosen),
                correctAnswer: getOptionText(q.correct_answer)
            });
        }
    });

    const activeCategory = localStorage.getItem('activeQuizCategory') || 'General Exam';
    const gradingPercentage = Math.round((score / currentQuestions.length) * 100);

    // 🌍 SUPABASE CLOUD COMMIT: Safely execute database sync while session is live
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('exam_results').insert([{
                student_email: session.user.email,
                student_name: session.user.user_metadata?.full_name || 'Student',
                category: activeCategory,
                score: score,
                total_questions: currentQuestions.length,
                percentage: gradingPercentage
            }]);
        }
    } catch (cloudErr) {
        console.error("Failed writing metrics log parameters:", cloudErr);
    }

    const resultsPackage = {
        category: activeCategory,
        score: score,
        total: currentQuestions.length,
        wrongAnswers: wrongAnswers
    };

    localStorage.setItem('letQuizResults', JSON.stringify(resultsPackage));
    localStorage.removeItem('activeQuizState'); // Erase running session cache upon successful completion
    window.location.href = 'results.html';
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const display = document.getElementById('timerDisplay');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        
        display.innerHTML = `<i class="fa-solid fa-clock"></i> ${minutes}:${seconds}`;

        if (timeLeft <= 300) {
            display.style.backgroundColor = '#FEE2E2';
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