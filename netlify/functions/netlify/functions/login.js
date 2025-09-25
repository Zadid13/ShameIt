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