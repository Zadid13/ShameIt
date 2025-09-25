# 🚀 HeartSupport Deployment Guide

## 📁 Complete File Structure

Create this exact folder structure on your computer:

```
heartsupport-website/
├── index.html                    (Main website)
├── styles.css                    (Main website styles)
├── script.js                     (Updated with database integration)
├── admin.html                    (Admin panel)
├── admin-styles.css             (Admin panel styles)
├── admin-script.js              (Admin panel functionality)
├── package.json                  (Dependencies)
├── netlify/
│   └── functions/
│       ├── init-database.js      (Database initialization)
│       ├── register.js           (User registration)
│       ├── login.js              (User login)
│       ├── posts.js              (Posts management)
│       └── like-post.js          (Like functionality)
└── README.md                     (This guide)
```

## 📋 Step-by-Step Deployment

### 1. Create Project Folder
```bash
mkdir heartsupport-website
cd heartsupport-website
```

### 2. Add All Files
Copy each file from the artifacts into your project folder with the exact structure above.

### 3. Create Netlify Functions
Create the `netlify/functions/` folder and add these separate files:

#### netlify/functions/register.js
```javascript
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    const client = new Client({
        connectionString: process.env.NETLIFY_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Email and password are required' })
            };
        }

        if (password.length < 6) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Password must be at least 6 characters' })
            };
        }

        await client.connect();

        // Check if user already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            await client.end();
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'User already exists' })
            };
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await client.query(`
            INSERT INTO users (email, password_hash) 
            VALUES ($1, $2) 
            RETURNING id, email, created_at, status
        `, [email.toLowerCase(), passwordHash]);

        const user = result.rows[0];

        await client.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    status: user.status
                }
            })
        };
    } catch (error) {
        console.error('Registration error:', error);
        
        if (client._connected) {
            await client.end();
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Registration failed. Please try again.'
            })
        };
    }
};
```

#### netlify/functions/login.js
```javascript
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    const client = new Client({
        connectionString: process.env.NETLIFY_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Email and password are required' })
            };
        }

        await client.connect();

        // Get user
        const result = await client.query(
            'SELECT id, email, password_hash, status, created_at FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            await client.end();
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Invalid email or password' })
            };
        }

        const user = result.rows[0];

        if (user.status === 'banned') {
            await client.end();
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ message: 'Account has been suspended' })
            };
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            await client.end();
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Invalid email or password' })
            };
        }

        await client.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    status: user.status,
                    created_at: user.created_at
                }
            })
        };
    } catch (error) {
        console.error('Login error:', error);
        
        if (client._connected) {
            await client.end();
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Login failed. Please try again.'
            })
        };
    }
};
```

### 4. Deploy to Netlify

#### Option A: Drag & Drop (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag your entire `heartsupport-website` folder to the deploy area
3. Netlify will automatically detect the functions and database connection

#### Option B: Git Integration (Recommended)
1. Create a GitHub repository
2. Upload your files to the repository
3. Connect the repository to Netlify
4. Automatic deployments on every push

### 5. Verify Database Connection

After deployment:
1. Check your site URL (e.g., `https://magnificent-blini-dbb6b9.netlify.app`)
2. Open browser developer tools (F12)
3. Try to register a new account
4. Check for any database connection errors in the console

### 6. Test Everything

**Test these features:**
- ✅ User registration
- ✅ User login  
- ✅ Create posts
- ✅ Like posts
- ✅ Admin panel access (`/admin.html`)

## 🔧 Troubleshooting

### Database Connection Issues
If you see database connection errors:

1. **Check Environment Variables:**
   - Go to Netlify Dashboard > Site Settings > Environment Variables
   - Verify `NETLIFY_DATABASE_URL` exists

2. **Check Function Logs:**
   - Go to Netlify Dashboard > Functions
   - Check the logs for error details

3. **Test Database Initialization:**
   - Visit: `https://your-site.netlify.app/.netlify/functions/init-database`
   - Should return: `{"success": true, "message": "Database initialized successfully"}`

### Common Issues

**Issue: Functions not found**
- Solution: Make sure `netlify/functions/` folder exists with all .js files

**Issue: Database tables don't exist**  
- Solution: Visit the init-database function URL to create tables

**Issue: CORS errors**
- Solution: Check that all function files include proper CORS headers

## 🎯 Next Steps

Once deployed successfully:

1. **Test with real users**
2. **Monitor the admin panel**
3. **Add custom domain** (optional)
4. **Set up monitoring** for errors

Your HeartSupport community platform is now live with a real PostgreSQL database! 🎉