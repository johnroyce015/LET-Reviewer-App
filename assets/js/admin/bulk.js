var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {

    // VIP Bouncer (Upgraded to full role check)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    const userRole = profileData && profileData.role ? profileData.role.toLowerCase() : 'student';

    if (userRole !== 'teacher' && userRole !== 'admin') {
        window.location.href = '../login.html'; return; 
    }

    const fileInput = document.getElementById("fileInput");
    const selectedFile = document.getElementById("selectedFile");

    if (fileInput) {
        fileInput.addEventListener("change", function () {
            if (fileInput.files.length > 0) {
                selectedFile.innerHTML = fileInput.files[0].name;
                selectedFile.style.color = '#10B981';
            }
        });
    }

    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Loading categories...</option>';

        const { data: categories, error: catError } = await supabase.from('categories').select('category_name');

        if (catError) {
            categorySelect.innerHTML = '<option value="">Error loading categories</option>';
            console.error(catError);
        } else if (categories && categories.length > 0) {
            categorySelect.innerHTML = '<option value="">-- Choose a Category --</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.category_name;
                option.textContent = cat.category_name;
                categorySelect.appendChild(option);
            });
        }
    }

    const form = document.getElementById('bulkUploadForm');
    const messageBox = document.getElementById('uploadMessage');
    const uploadBtn = document.getElementById('uploadBtn');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const file = fileInput.files[0];
            const selectedCategory = categorySelect.value;

            if (!file || !selectedCategory) {
                window.showNeoModal({ title: 'Missing Info', message: 'Please select a file and a category.' });
                return;
            }

            uploadBtn.textContent = "Processing CSV...";
            uploadBtn.disabled = true;

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async function (results) {
                    const csvData = results.data;
                    const formattedQuestions = csvData.map(row => {
                        const values = Object.values(row);
                        return {
                            category: selectedCategory,
                            question_text: values[0],
                            option_a: values[1],
                            option_b: values[2],
                            option_c: values[3],
                            option_d: values[4],
                            correct_answer: values[5]
                        };
                    });

                    const { error } = await supabase.from('questions').insert(formattedQuestions);

                    if (error) {
                        messageBox.style.color = '#EF4444';
                        messageBox.textContent = "Upload Failed: " + error.message;
                    } else {
                        if (typeof window.logSystemActivity === 'function') {
                            await window.logSystemActivity('UPLOAD', `Bulk uploaded ${formattedQuestions.length} questions to ${selectedCategory}`);
                        } else {
                            console.error("The logger function is still missing from this page!");
                        }

                        messageBox.style.color = '#10B981';
                        messageBox.textContent = `✅ Successfully uploaded ${formattedQuestions.length} questions!`;
                        form.reset();
                        selectedFile.innerHTML = "No file selected";
                        selectedFile.style.color = "#111827";
                    }
                }
            });
        });
    }
});