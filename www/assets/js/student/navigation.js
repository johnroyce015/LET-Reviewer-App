document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const isDashboard = path.includes('dashboard.html') || path.endsWith('/');
    const isReview = path.includes('review.html');
    const isExams = path.includes('exams.html');
    const isInsights = path.includes('insights.html');

    // Cleaned Template Strings (No inline styles)
    const bottomNavHTML = `
        <nav class="bottom-nav">
            <a href="dashboard.html" class="nav-item ${isDashboard ? 'active' : ''}"><i class="fa-solid fa-house"></i><span>Home</span></a>
            <a href="review.html" class="nav-item ${isReview ? 'active' : ''}"><i class="fa-solid fa-book-open"></i><span>Review</span></a>
            <a href="exams.html" class="nav-item ${isExams ? 'active' : ''}"><i class="fa-solid fa-file-pen"></i><span>Exams</span></a>
            <a href="insights.html" class="nav-item ${isInsights ? 'active' : ''}"><i class="fa-solid fa-chart-line"></i><span>Insights</span></a>
        </nav>
    `;

    const sidebarHTML = `
        <div id="profileSidebarDrawer" class="profile-drawer">
            <div class="drawer-header">
                <h2>Account</h2>
                <button id="closeProfileSidebar" class="close-drawer-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="drawer-content">
                <div class="neo-card mobile-card yellow-card sidebar-profile-card">
                    <h3 id="sidebarName" class="sidebar-name">Loading...</h3>
                    <p id="sidebarCourse" class="sidebar-course"></p>
                </div>
                <div class="drawer-menu">
                    <a href="#" class="drawer-link"><i class="fa-solid fa-cloud-arrow-up"></i> Sync Offline Scores</a>
                    <a href="#" class="drawer-link"><i class="fa-solid fa-database"></i> Clear Device Cache</a>
                    <a href="#" class="drawer-link"><i class="fa-solid fa-bullseye"></i> Edit Target Rating</a>
                </div>
            </div>
            <div class="drawer-footer">
                <button id="sidebarLogoutBtn" class="neo-button sidebar-logout-btn">
                    <i class="fa-solid fa-right-from-bracket"></i> Log Out
                </button>
            </div>
        </div>
        <div id="drawerOverlay" class="drawer-overlay"></div>
    `;

    const appContainer = document.querySelector('.mobile-app-container');
    if (appContainer) appContainer.insertAdjacentHTML('beforeend', bottomNavHTML);
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);

    const openBtn = document.getElementById('openProfileSidebar');
    const closeBtn = document.getElementById('closeProfileSidebar');
    const drawer = document.getElementById('profileSidebarDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const logoutBtn = document.getElementById('sidebarLogoutBtn');

    if (openBtn && drawer && overlay) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            drawer.classList.add('open');
            overlay.classList.add('open');
            fetchSidebarProfile(); 
        });

        const closeDrawer = () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
        };

        if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);
    }

    async function fetchSidebarProfile() {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (session) {
            const nameEl = document.getElementById('sidebarName');
            const courseEl = document.getElementById('sidebarCourse');
            if (nameEl) nameEl.textContent = session.user.user_metadata?.full_name || 'Student';
            if (courseEl) courseEl.textContent = session.user.user_metadata?.course || 'Major Subject';
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging out...';
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
                window.location.href = '../login.html';
            }
        });
    }
});