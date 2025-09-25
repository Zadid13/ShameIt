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

        // Always try to close the client safely
        try { await client.end(); } catch (e) {}

        // Return the real error message for debugging (remove in production)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: error.message || 'Registration failed. Please try again.'
            })
        };
    }
};