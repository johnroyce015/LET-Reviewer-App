var supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) { window.location.href = '../login.html'; return; }

    const userName = session.user.user_metadata?.full_name || 'Student';
    const userCourse = session.user.user_metadata?.course || 'BSEd';
    
    document.getElementById('studentNameDisplay').textContent = userName;
    document.getElementById('studentCourseDisplay').textContent = userCourse;

    document.body.style.visibility = 'visible';
    
    loadStudentPerformanceLogs(session.user.email);
});

async function loadStudentPerformanceLogs(email) {
    const container = document.getElementById('insightsContainer');
    if (!container) return;

    container.innerHTML = '<div class="state-loading"><i class="fa-solid fa-spinner fa-spin"></i> Compiling history logs...</div>';

    const { data: records, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_email', email)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="state-error">Failed to extract log parameters: ${error.message}</div>`;
        return;
    }

    if (!records || records.length === 0) {
        container.innerHTML = `
            <div class="neo-card mobile-card white-card insights-empty-card">
                <i class="fa-solid fa-chart-pie insights-icon"></i>
                <h3 class="insights-empty-title">Analytics Engine Ready</h3>
                <p class="insights-empty-desc">Once your exam history is saved to the cloud, your personalized mastery tracking will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '<h3 style="margin-bottom: 15px; font-weight: 900;"><i class="fa-solid fa-history"></i> Your Historical Performance</h3>';

    records.forEach(row => {
        const attemptDate = new Date(row.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        
        const passedMark = row.percentage >= 75;

        container.innerHTML += `
            <div class="neo-card mobile-card white-card" style="border: 2px solid #111827; display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 12px; box-shadow: 4px 4px 0px #111827; border-radius: 12px; background: #fff;">
                <div>
                    <span class="status-pill" style="background: ${passedMark ? '#6EE7B7' : '#FCA5A5'}; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #111827;">${passedMark ? 'PASSED' : 'RETRY'}</span>
                    <h4 style="margin: 6px 0 2px 0; font-size: 16px; font-weight: 900; color: #111827;">${row.category}</h4>
                    <p style="margin: 0; font-size: 12px; color: #6B7280; font-weight: 700;"><i class="fa-solid fa-calendar-day"></i> ${attemptDate}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 22px; font-weight: 900; color: #111827;">${row.percentage}%</div>
                    <p style="margin: 0; font-size: 12px; color: #4B5563; font-weight: 700;">Score: ${row.score}/${row.total_questions}</p>
                </div>
            </div>
        `;
    });
}