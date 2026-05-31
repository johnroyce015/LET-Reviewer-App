const supabaseUrl = 'https://hznbjmwmwokjdufbqrkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmJqbXdtd29ramR1ZmJxcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTY1ODAsImV4cCI6MjA5Mzk5MjU4MH0.ul2LPyJV1m2hfkv2qt4Qr-R6T5fGshITFAJTAa5lLsU';

// Attach it to the global window object
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
// ==========================================
// UNIVERSAL ACTIVITY LOGGER
// ==========================================
window.logSystemActivity = async function(actionType, description) {
    try {
        // 1. Get the current logged-in user
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return; // Don't log if no one is logged in

        // 2. Send the log to the Supabase database
        await window.supabaseClient.from('activity_logs').insert([{
            user_email: session.user.email,
            action_type: actionType,
            description: description
        }]);
    } catch (err) {
        console.error("Activity logging failed:", err);
    }
};
// GLOBAL SYSTEM LOGGER
window.logSystemActivity = async function(actionType, details) {
    try {
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (sessionError || !session) return; 

        const { error } = await window.supabaseClient.from('activity_logs').insert([{
            user_email: session.user.email,
            action_type: actionType,
            description: details
        }]);

        if (error) {
            console.error("Database refused the log:", error.message);
        }
    } catch (err) {
        console.error("Logger crashed:", err);
    }
};