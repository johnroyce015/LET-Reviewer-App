var supabase = window.supabaseClient;

let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {}; 
let timerInterval;
let timeLeft = 3600; 

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '../login.html'; return; }

    // 🟢 THE FIX: Read active category from standard localStorage!
    const category = localStorage.getItem('activeQuizCategory');
    
    if (!category) { 
        console.warn("No category found in localStorage. Kicking to dashboard.");
        window.location.href = 'dashboard.html'; 
        return; 
    }
    
    document.getElementById('quizCategoryLabel').textContent = category;

    document.getElementById('quitQuizBtn').addEventListener('click', confirmQuit);
    document.getElementById('nextBtn').addEventListener('click', handleNext);
    document.getElementById('prevBtn').addEventListener('click', handlePrev);

    fetchQuestions(category);
});

async function fetchQuestions(categoryName) {
    document.getElementById('questionText').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching questions...';

    // Pull heavy data using your OfflineSync engine (which uses localforage)
    const questions = await window.OfflineSync.syncQuestions(categoryName);

    if (!questions || questions.length === 0) {
        document.getElementById('questionText').textContent = "No questions found. Please connect to the internet once to download the review materials!";
        document.getElementById('nextBtn').style.display = 'none';
        return;
    }

    currentQuestions = questions.sort(() => Math.random() - 0.5);
    startTimer();
    renderQuestion();
}

function renderQuestion() {
    const question = currentQuestions[currentIndex];
    
    document.getElementById('questionCounter').textContent = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
    document.getElementById('questionText').textContent = question.question_text;
    
    const progressPercent = ((currentIndex) / currentQuestions.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;

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
        onConfirm: () => window.location.href = 'dashboard.html'
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

    // 🟢 THE FIX: Read category from standard localStorage
    const activeCategory = localStorage.getItem('activeQuizCategory');

    const resultsPackage = {
        category: activeCategory,
        score: score,
        total: currentQuestions.length,
        wrongAnswers: wrongAnswers
    };

    // Save heavy exam history straight to IndexedDB (localforage)
    await localforage.setItem('letQuizResults', resultsPackage);

    const pendingScores = (await localforage.getItem('pending_exam_results')) || [];

    pendingScores.push({
        category: resultsPackage.category,
        score: score,
        total: currentQuestions.length,
        submitted_at: new Date().toISOString()
    });

    await localforage.setItem('pending_exam_results', pendingScores);
    
    window.location.href = 'results.html';
}

function startTimer() {
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
            display.style.border = '2px solid #111827'; 
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Auto-submitting your exam.");
            gradeExam();
        }
    }, 1000);
}