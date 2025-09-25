async function loadPosts() {
    try {
        const result = await apiCall('/posts');
        posts = result.posts || [];
        
        const container = document.getElementById('postsContainer');
        if (container) {
            container.innerHTML = posts.map(post => `
                <div class="post">
                    <div class="post-header">
                        <span class="anonymous-user">Anonymous Community Member</span>
                        <span class="post-time">${formatTimeAgo(new Date(post.created_at))}</span>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="likePost(${post.id})">❤️ ${post.likes} Likes</button>
                        <button class="action-btn">💬 ${post.comments || 0} Comments</button>
                        <button class="action-btn">🤗 Support</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load posts:', error);
        // Show demo posts as fallback
        const demoContainer = document.getElementById('postsContainer');
        if (demoContainer) {
            demoContainer.innerHTML = `
                <div class="post">
                    <div class="post-content">
                        <p>Loading posts from database...</p>
                        <p><em>If posts don't load, the database connection may need initialization.</em></p>
                    </div>
                </div>
            `;
        }
    }
}// Database connection and current user state
let currentUser = null;
let posts = [];

// Database API endpoints
const API_BASE = '/.netlify/functions';

// Database helper functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API call failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

function showLogin() {
    document.getElementById('hero').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

function showRegister() {
    document.getElementById('hero').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function showHome() {
    document.getElementById('hero').style.display = 'block';
    document.getElementById('mainContent').style.display = 'grid';
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('dashboard').classList.remove('active');
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const result = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
        }
    } catch (error) {
        if (email === 'demo@example.com') {
            // Fallback for demo
            currentUser = { id: 'demo', email: email };
            showDashboard();
        } else {
            alert(error.message || 'Login failed. Please try again.');
        }
    }
}

async function register() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (!email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        const result = await apiCall('/register', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
        }
    } catch (error) {
        alert(error.message || 'Registration failed. Please try again.');
    }
}

function showDashboard() {
    document.getElementById('hero').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('dashboard').classList.add('active');

    // Update navbar
    document.getElementById('navButtons').innerHTML = `
        <button class="btn btn-secondary" onclick="logout()">Logout</button>
    `;

    loadPosts();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('navButtons').innerHTML = `
        <button class="btn btn-secondary" onclick="showLogin()">Login</button>
        <button class="btn btn-primary" onclick="showRegister()">Join Community</button>
    `;
    showHome();
}

async function createPost() {
    if (!currentUser) return;

    const content = document.getElementById('postContent').value.trim();
    if (!content) {
        alert('Please write something to share');
        return;
    }

    try {
        const result = await apiCall('/posts', {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUser.id,
                content: content
            })
        });

        if (result.success) {
            document.getElementById('postContent').value = '';
            await loadPosts(); // Reload posts from database
        }
    } catch (error) {
        alert(error.message || 'Failed to create post. Please try again.');
    }
}

async function loadPosts() {
    try {
        const result = await apiCall('/posts');
        posts = result.posts || [];
        
        const container = document.getElementById('postsContainer');
        if (container) {
            container.innerHTML = posts.map(post => `
                <div class="post">
                    <div class="post-header">
                        <span class="anonymous-user">Anonymous Community Member</span>
                        <span class="post-time">${formatTimeAgo(new Date(post.created_at))}</span>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="likePost(${post.id})">❤️ ${post.likes} Likes</button>
                        <button class="action-btn">💬 ${post.comments || 0} Comments</button>
                        <button class="action-btn">🤗 Support</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load posts:', error);
        // Show demo posts as fallback
        const demoContainer = document.getElementById('postsContainer');
        if (demoContainer) {
            demoContainer.innerHTML = `
                <div class="post">
                    <div class="post-content">
                        <p>Loading posts from database...</p>
                        <p><em>If posts don't load, the database connection may need initialization.</em></p>
                    </div>
                </div>
            `;
        }
    }
}

async function likePost(postId) {
    try {
        const result = await apiCall(`/posts/${postId}/like`, {
            method: 'POST'
        });

        if (result.success) {
            await loadPosts(); // Reload posts to show updated like count
        }
    } catch (error) {
        console.error('Failed to like post:', error);
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
}

// Initialize the page
window.onload = async function() {
    // Check for saved user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        // Verify user session is still valid
        try {
            // You could add a session validation endpoint here
        } catch (error) {
            localStorage.removeItem('currentUser');
            currentUser = null;
        }
    }

    // Initialize database
    try {
        await apiCall('/init-database', { method: 'POST' });
    } catch (error) {
        console.error('Database initialization failed:', error);
    }

    // Load posts
    await loadPosts();
};