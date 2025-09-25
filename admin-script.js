// Admin panel data and functionality
let adminLoggedIn = false;
let reports = [];
let adminSettings = {
    autoModeration: true,
    requireApproval: false,
    allowAnonymous: true,
    maxPosts: 10,
    siteName: 'HeartSupport',
    supportEmail: 'support@heartsupport.com'
};

// Sample data for demonstration
let sampleUsers = [
    { id: 1, email: 'user1@example.com', joinDate: '2024-01-15', posts: 12, status: 'active' },
    { id: 2, email: 'user2@example.com', joinDate: '2024-02-20', posts: 8, status: 'active' },
    { id: 3, email: 'user3@example.com', joinDate: '2024-03-10', posts: 0, status: 'banned' }
];

let samplePosts = [
    { id: 1, content: 'Going through a difficult breakup...', userId: 1, date: '2024-09-20', likes: 12, status: 'approved' },
    { id: 2, content: 'Therapy has been incredibly helpful...', userId: 2, date: '2024-09-19', likes: 24, status: 'approved' },
    { id: 3, content: 'Learning to love myself again...', userId: 1, date: '2024-09-18', likes: 31, status: 'pending' }
];

reports = [
    {
        id: 1,
        type: 'Inappropriate Content',
        postId: 2,
        reportedBy: 'user3@example.com',
        reason: 'Contains inappropriate language',
        date: '2024-09-23',
        status: 'pending',
        content: 'This post contains language that makes me uncomfortable...'
    },
    {
        id: 2,
        type: 'Spam',
        postId: 1,
        reportedBy: 'user1@example.com',
        reason: 'Repetitive content posted multiple times',
        date: '2024-09-22',
        status: 'resolved',
        content: 'User keeps posting the same message...'
    }
];

// Admin login functionality
function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (username === 'admin' && password === 'admin123') {
        adminLoggedIn = true;
        document.getElementById('adminLoginModal').classList.remove('active');
        initializeAdmin();
    } else {
        alert('Invalid credentials. Use: admin / admin123');
    }
}

function adminLogout() {
    adminLoggedIn = false;
    document.getElementById('adminLoginModal').classList.add('active');
}

// Initialize admin panel
function initializeAdmin() {
    updateDashboardStats();
    loadRecentActivity();
    loadPostsTable();
    loadUsersTable();
    loadReports();
}

// Navigation
function showSection(sectionName) {
    // Remove active class from all sections and nav items
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to selected section and nav item
    document.getElementById(sectionName).classList.add('active');
    document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        posts: 'Posts Management',
        users: 'Users Management', 
        reports: 'Reports',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];
}

// Dashboard functionality
function updateDashboardStats() {
    document.getElementById('totalUsers').textContent = sampleUsers.length;
    document.getElementById('totalPosts').textContent = samplePosts.length;
    document.getElementById('totalReports').textContent = reports.filter(r => r.status === 'pending').length;
    document.getElementById('dailyActive').textContent = Math.floor(Math.random() * 50) + 10;
}

function loadRecentActivity() {
    const activities = [
        { text: 'New user registered: user4@example.com', time: '2 minutes ago' },
        { text: 'Post reported for inappropriate content', time: '15 minutes ago' },
        { text: 'User banned: spammer@example.com', time: '1 hour ago' },
        { text: 'New post approved by moderator', time: '2 hours ago' },
        { text: 'Community guidelines updated', time: '3 hours ago' }
    ];

    const activityList = document.getElementById('activityList');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <span class="activity-text">${activity.text}</span>
            <span class="activity-time">${activity.time}</span>
        </div>
    `).join('');
}

// Posts management
function loadPostsTable() {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = samplePosts.map(post => `
        <tr>
            <td>#${post.id}</td>
            <td>${post.content.substring(0, 50)}...</td>
            <td>User #${post.userId}</td>
            <td>${post.date}</td>
            <td>${post.likes}</td>
            <td><span class="status-badge status-${post.status}">${post.status}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editPost(${post.id})">Edit</button>
                <button class="action-btn btn-delete" onclick="deletePost(${post.id})">Delete</button>
                ${post.status === 'pending' ? `<button class="action-btn btn-approve" onclick="approvePost(${post.id})">Approve</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function editPost(postId) {
    const post = samplePosts.find(p => p.id === postId);
    if (post) {
        const newContent = prompt('Edit post content:', post.content);
        if (newContent) {
            post.content = newContent;
            loadPostsTable();
            alert('Post updated successfully!');
        }
    }
}

function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        const index = samplePosts.findIndex(p => p.id === postId);
        if (index > -1) {
            samplePosts.splice(index, 1);
            loadPostsTable();
            updateDashboardStats();
            alert('Post deleted successfully!');
        }
    }
}

function approvePost(postId) {
    const post = samplePosts.find(p => p.id === postId);
    if (post) {
        post.status = 'approved';
        loadPostsTable();
        alert('Post approved successfully!');
    }
}

function searchPosts() {
    const searchTerm = document.getElementById('postSearch').value.toLowerCase();
    const filteredPosts = samplePosts.filter(post => 
        post.content.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = filteredPosts.map(post => `
        <tr>
            <td>#${post.id}</td>
            <td>${post.content.substring(0, 50)}...</td>
            <td>User #${post.userId}</td>
            <td>${post.date}</td>
            <td>${post.likes}</td>
            <td><span class="status-badge status-${post.status}">${post.status}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editPost(${post.id})">Edit</button>
                <button class="action-btn btn-delete" onclick="deletePost(${post.id})">Delete</button>
                ${post.status === 'pending' ? `<button class="action-btn btn-approve" onclick="approvePost(${post.id})">Approve</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Users management
function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = sampleUsers.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.email}</td>
            <td>${user.joinDate}</td>
            <td>${user.posts}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editUser(${user.id})">Edit</button>
                ${user.status === 'active' ? 
                    `<button class="action-btn btn-ban" onclick="banUser(${user.id})">Ban</button>` :
                    `<button class="action-btn btn-approve" onclick="unbanUser(${user.id})">Unban</button>`
                }
                <button class="action-btn btn-delete" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function editUser(userId) {
    const user = sampleUsers.find(u => u.id === userId);
    if (user) {
        const newEmail = prompt('Edit user email:', user.email);
        if (newEmail && newEmail !== user.email) {
            user.email = newEmail;
            loadUsersTable();
            alert('User updated successfully!');
        }
    }
}

function banUser(userId) {
    if (confirm('Are you sure you want to ban this user?')) {
        const user = sampleUsers.find(u => u.id === userId);
        if (user) {
            user.status = 'banned';
            loadUsersTable();
            alert('User banned successfully!');
        }
    }
}

function unbanUser(userId) {
    const user = sampleUsers.find(u => u.id === userId);
    if (user) {
        user.status = 'active';
        loadUsersTable();
        alert('User unbanned successfully!');
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        const index = sampleUsers.findIndex(u => u.id === userId);
        if (index > -1) {
            sampleUsers.splice(index, 1);
            loadUsersTable();
            updateDashboardStats();
            alert('User deleted successfully!');
        }
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filteredUsers = sampleUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.email}</td>
            <td>${user.joinDate}</td>
            <td>${user.posts}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editUser(${user.id})">Edit</button>
                ${user.status === 'active' ? 
                    `<button class="action-btn btn-ban" onclick="banUser(${user.id})">Ban</button>` :
                    `<button class="action-btn btn-approve" onclick="unbanUser(${user.id})">Unban</button>`
                }
                <button class="action-btn btn-delete" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Reports management
function loadReports() {
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = reports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <span class="report-type">${report.type}</span>
                <span class="activity-time">${report.date}</span>
            </div>
            <div class="report-content">
                <strong>Reported by:</strong> ${report.reportedBy}<br>
                <strong>Reason:</strong> ${report.reason}<br>
                <strong>Content:</strong> ${report.content}
            </div>
            <div class="report-actions">
                ${report.status === 'pending' ? `
                    <button class="action-btn btn-approve" onclick="resolveReport(${report.id})">Resolve</button>
                    <button class="action-btn btn-delete" onclick="dismissReport(${report.id})">Dismiss</button>
                ` : `
                    <span class="status-badge status-${report.status}">${report.status}</span>
                `}
                <button class="action-btn btn-edit" onclick="viewReportedPost(${report.postId})">View Post</button>
            </div>
        </div>
    `).join('');
}

function resolveReport(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (report) {
        report.status = 'resolved';
        loadReports();
        updateDashboardStats();
        alert('Report resolved successfully!');
    }
}

function dismissReport(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (report) {
        report.status = 'dismissed';
        loadReports();
        updateDashboardStats();
        alert('Report dismissed successfully!');
    }
}

function viewReportedPost(postId) {
    const post = samplePosts.find(p => p.id === postId);
    if (post) {
        alert(`Post Content:\n\n${post.content}\n\nLikes: ${post.likes}\nStatus: ${post.status}`);
    } else {
        alert('Post not found (may have been deleted)');
    }
}

function filterReports() {
    const filter = document.getElementById('reportFilter').value;
    let filteredReports = reports;
    
    if (filter !== 'all') {
        filteredReports = reports.filter(report => report.status === filter);
    }
    
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = filteredReports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <span class="report-type">${report.type}</span>
                <span class="activity-time">${report.date}</span>
            </div>
            <div class="report-content">
                <strong>Reported by:</strong> ${report.reportedBy}<br>
                <strong>Reason:</strong> ${report.reason}<br>
                <strong>Content:</strong> ${report.content}
            </div>
            <div class="report-actions">
                ${report.status === 'pending' ? `
                    <button class="action-btn btn-approve" onclick="resolveReport(${report.id})">Resolve</button>
                    <button class="action-btn btn-delete" onclick="dismissReport(${report.id})">Dismiss</button>
                ` : `
                    <span class="status-badge status-${report.status}">${report.status}</span>
                `}
                <button class="action-btn btn-edit" onclick="viewReportedPost(${report.postId})">View Post</button>
            </div>
        </div>
    `).join('');
}

// Settings management
function saveSettings() {
    // Get all setting values
    adminSettings.autoModeration = document.getElementById('autoModeration').checked;
    adminSettings.requireApproval = document.getElementById('requireApproval').checked;
    adminSettings.allowAnonymous = document.getElementById('allowAnonymous').checked;
    adminSettings.maxPosts = document.getElementById('maxPosts').value;
    adminSettings.siteName = document.getElementById('siteName').value;
    adminSettings.supportEmail = document.getElementById('supportEmail').value;
    
    // Save guidelines
    const guidelines = document.getElementById('guidelines').value;
    adminSettings.guidelines = guidelines;
    
    // Show confirmation
    alert('Settings saved successfully!');
    
    // You could send this data to a server here
    console.log('Settings saved:', adminSettings);
}

// Initialize on page load
window.onload = function() {
    // Check if admin is already logged in (in a real app, check session/token)
    if (!adminLoggedIn) {
        document.getElementById('adminLoginModal').classList.add('active');
    }
};