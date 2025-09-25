// netlify/functions/init-database.js
// This function initializes the database tables

const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const client = new Client({
        connectionString: process.env.NETLIFY_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                post_count INTEGER DEFAULT 0
            )
        `);

        // Create posts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                likes INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                anonymous_id VARCHAR(50)
            )
        `);

        // Create reports table
        await client.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                reported_by VARCHAR(255),
                reason TEXT,
                report_type VARCHAR(50),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create activity log table
        await client.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                action VARCHAR(100),
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert sample data if tables are empty
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) === 0) {
            // Create admin user
            await client.query(`
                INSERT INTO users (email, password_hash, status) 
                VALUES ('admin@heartsupport.com', '$2a$10$example_hash', 'admin')
            `);

            // Create sample posts
            await client.query(`
                INSERT INTO posts (user_id, content, status, anonymous_id) VALUES 
                (1, 'Going through a difficult breakup after discovering my partner was being dishonest. The hardest part is learning to trust again. Anyone else been through something similar?', 'approved', 'anonymous_user_1'),
                (1, 'Want to share that therapy has been incredibly helpful in my healing journey. If you''re struggling, please consider reaching out to a professional. You deserve support and happiness.', 'approved', 'anonymous_user_2'),
                (1, 'Learning to love myself again has been the most important part of moving forward. Some days are harder than others, but I''m getting there. Sending love to everyone on their journey.', 'approved', 'anonymous_user_3')
            `);

            // Update post likes
            await client.query(`UPDATE posts SET likes = 12 WHERE id = 1`);
            await client.query(`UPDATE posts SET likes = 24 WHERE id = 2`);
            await client.query(`UPDATE posts SET likes = 31 WHERE id = 3`);

            // Insert sample reports
            await client.query(`
                INSERT INTO reports (post_id, reported_by, reason, report_type, status) VALUES 
                (2, 'user@example.com', 'Contains inappropriate language', 'Inappropriate Content', 'pending'),
                (1, 'another@example.com', 'Repetitive content posted multiple times', 'Spam', 'resolved')
            `);
        }

        await client.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Database initialized successfully'
            })
        };
    } catch (error) {
        console.error('Database initialization error:', error);
        
        if (client._connected) {
            await client.end();
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};