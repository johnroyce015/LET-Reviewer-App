var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const userName = session.user.user_metadata?.full_name || 'Student';
    const userCourse = session.user.user_metadata?.course || 'BSEd';
    
    document.getElementById('studentNameDisplay').textContent = userName;
    document.getElementById('studentCourseDisplay').textContent = userCourse;

    document.body.style.visibility = 'visible';
    
    // Future integration: 
    // This is where you will add a fetch call to an "exam_results" table 
    // once you start saving the scores from results.js to Supabase!
});