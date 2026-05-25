document.addEventListener('DOMContentLoaded', async () => {
    
    const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // --- 2. FILE SELECTION UI ---
    const fileInput = document.getElementById("fileInput");
    const selectedFile = document.getElementById("selectedFile");
    
    fileInput.addEventListener("change", function(){
        if(fileInput.files.length > 0){
            selectedFile.innerHTML = fileInput.files[0].name;
            selectedFile.style.color = '#10B981'; 
        }
    });

    // --- 3. LOAD CATEGORIES INTO DROPDOWN ---
    const categorySelect = document.getElementById('categorySelect');
    
    console.log("Attempting to connect to Supabase..."); // Spy 1
    
    const { data: categories, error: catError } = await supabase.from('categories').select('category_name');
    
    if (catError) {
        // If there is an error, this will print it in bright red in your console!
        console.error("SUPABASE ERROR:", catError); 
        categorySelect.innerHTML = '<option value="">Check Console (F12) for exact error</option>';
    } else if (categories && categories.length > 0) {
        console.log("Success! Found these categories:", categories); // Spy 2
        categorySelect.innerHTML = '<option value="">-- Choose a Category --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_name; 
            option.textContent = cat.category_name;
            categorySelect.appendChild(option);
        });
    } else {
        console.warn("Connection worked, but the table returned 0 rows."); // Spy 3
        categorySelect.innerHTML = '<option value="">Table is empty</option>';
    }

    // --- 4. HANDLE THE CSV UPLOAD ---
    const form = document.getElementById('bulkUploadForm');
    const messageBox = document.getElementById('uploadMessage');
    const uploadBtn = document.getElementById('uploadBtn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        const selectedCategory = categorySelect.value;

        if (!file || !selectedCategory) {
            alert("Please select a file and a category.");
            return;
        }

        uploadBtn.textContent = "Processing CSV...";
        uploadBtn.disabled = true;

        Papa.parse(file, {
            header: true, 
            skipEmptyLines: true,
            complete: async function(results) {
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

                const { data, error } = await supabase
                    .from('questions')
                    .insert(formattedQuestions);

                if (error) {
                    messageBox.style.color = '#DC2626';
                    messageBox.textContent = "Upload Failed: " + error.message;
                } else {
                    messageBox.style.color = '#10B981';
                    messageBox.textContent = `✅ Successfully uploaded ${formattedQuestions.length} questions!`;
                    form.reset();
                    selectedFile.innerHTML = "No file selected";
                    selectedFile.style.color = "#111827";
                }

                uploadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Upload File`;
                uploadBtn.disabled = false;
            }
        });
    });
});