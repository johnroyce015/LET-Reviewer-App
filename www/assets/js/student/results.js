document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch the saved results from browser memory
    const resultsJSON = localStorage.getItem('letQuizResults');
    
    if (!resultsJSON) {
        window.location.href = 'dashboard.html';
        return;
    }

    const results = JSON.parse(resultsJSON);
    const percentage = Math.round((results.score / results.total) * 100);

    // 2. Populate the Score Card
    document.getElementById('resultCategory').textContent = results.category || 'Mock Exam';
    document.getElementById('resultScore').textContent = `${results.score} / ${results.total}`;

    // 3. Dynamic Message Styling
    const msgEl = document.getElementById('resultMessage');
    if (percentage >= 75) {
        msgEl.textContent = "Great job! You are ready for the board exam.";
        msgEl.style.color = "#10B981"; 
    } else {
        msgEl.textContent = "Keep practicing! Review your mistakes below.";
        msgEl.style.color = "#EF4444"; 
    }

    // 4. Render the Mistakes Grid using clean CSS classes!
    const mistakesContainer = document.getElementById('mistakesContainer');
    mistakesContainer.innerHTML = '';

    if (results.wrongAnswers && results.wrongAnswers.length > 0) {
        results.wrongAnswers.forEach(mistake => {
            mistakesContainer.innerHTML += `
                <div class="neo-card mobile-card mistake-card">
                    <p class="mistake-question">${mistake.question}</p>
                    <div class="mistake-details">
                        <div class="mistake-user"><i class="fa-solid fa-xmark"></i> Your Answer: ${mistake.userAnswer}</div>
                        <div class="mistake-correct"><i class="fa-solid fa-check"></i> Correct Answer: ${mistake.correctAnswer}</div>
                    </div>
                </div>
            `;
        });
    } else {
        mistakesContainer.innerHTML = `
            <div class="neo-card mobile-card perfect-card">
                <p class="perfect-msg">🎉 Perfect Score! No mistakes to review.</p>
            </div>
        `;
    }

    // 5. Clean up memory
    localStorage.removeItem('letQuizResults');
});