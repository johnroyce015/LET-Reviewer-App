const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';

// Attach it to the global window object
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// UNIVERSAL ACTIVITY LOGGER
// ==========================================
window.logSystemActivity = async function(actionType, details) {
    console.log(`🚀 Attempting to log action: [${actionType}]`);

    try {
        // 1. Verify the user is currently logged in
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            console.warn("⚠️ Cannot log activity: No active user session found.");
            return; 
        }

        // 2. Send the log to the Supabase database
        const { data, error } = await window.supabaseClient
            .from('activity_logs')
            .insert([{
                user_email: session.user.email,
                action_type: actionType,
                description: details
            }])
            .select(); // .select() forces Supabase to return the inserted row

        // 3. Catch Database or RLS Errors
        if (error) {
            console.error("❌ Supabase refused the log:", error.message);
            console.error("Hint: Check your Row Level Security (RLS) policies for the activity_logs table.");
            return;
        }

        console.log("✅ Successfully inserted into database:", data);

    } catch (err) {
        console.error("❌ Logger crashed unexpectedly:", err);
    }
};