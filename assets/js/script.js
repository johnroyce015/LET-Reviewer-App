document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('questionForm');
    const statusMessage = document.getElementById('statusMessage');

    if (questionForm) {
        questionForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page from refreshing
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            // 1. Gather data from the form
            const newQuestion = {
                category: document.getElementById('category').value,
                question_text: document.getElementById('question_text').value,
                option_a: document.querySelector('input[name="option_a"]').value,
                option_b: document.querySelector('input[name="option_b"]').value,
                option_c: document.querySelector('input[name="option_c"]').value,
                option_d: document.querySelector('input[name="option_d"]').value,
                correct_answer: document.querySelector('input[name="correct_answer"]:checked').value
            };

            // 2. Send to Supabase
            const { data, error } = await supabase
                .from('questions')
                .insert([newQuestion]);

            // 3. Handle the result
            if (error) {
                statusMessage.style.color = 'red';
                statusMessage.textContent = 'Error: ' + error.message;
            } else {
                statusMessage.style.color = 'green';
                statusMessage.textContent = '✅ Question saved successfully!';
                questionForm.reset(); // Clear the form for the next question
            }

            submitBtn.textContent = 'Save Question to Cloud';
            submitBtn.disabled = false;
        });
    }
});