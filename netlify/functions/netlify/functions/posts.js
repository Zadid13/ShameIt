// netlify/functions/posts.js
const { Client } = require('pg');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const client = new Client({
        connectionString: process.env.NETLIFY_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // GET - Retrieve posts
        if (event.httpMethod === 'GET') {
            const limit = event.queryStringParameters?.limit || 50;
            
            const result = await client.query(`
                SELECT 
                    p.id, 
                    p.content, 
                    p.likes, 
                    p.created_at,
                    p.status,
                    p.anonymous_id,
                    0 as comments
                FROM posts p 
                WHERE p.status = 'approved'
                ORDER BY p.created_at DESC 
                LIMIT $1
            `, [limit]);

            await client.end();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    posts: result.rows
                })
            };
        }

        // POST - Create new post
        if (event.httpMethod === 'POST') {
            const { userId, content } = JSON.parse(event.body);

            if (!content || !userId) {
                await client.end();
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'Content and user ID are required' })
                };
            }

            if (content.length > 2000) {
                await client.end();
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'Content too long (max 2000 characters)' })
                };
            }

            // Generate anonymous ID
            const anonymousId = `anonymous_user_${Math.floor(Math.random() * 10000)}`;

            const result = await client.query(`
                INSERT INTO posts (user_id, content, anonymous_id, status) 
                VALUES ($1, $2, $3, 'approved') 
                RETURNING id, content, likes, created_at, anonymous_id
            `, [userId, content, anonymousId]);

            // Update user post count
            await client.query(`
                UPDATE users 
                SET post_count = post_count + 1 
                WHERE id = $1
            `, [userId]);

            // Log activity
            await client.query(`
                INSERT INTO activity_log (action, details) 
                VALUES ('post_created', $1)
            `, [`New post created by user ${userId}`]);

            await client.end();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    post: result.rows[0]
                })
            };
        }

        await client.end();
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Posts API error:', error);
        
        if (client._connected) {
            await client.end();
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Server error'
            })
        };
    }
};

// netlify/functions/like-post.js - Create this as a separate file
const likePostHandler = async (event, context) => {
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
        // Extract post ID from path
        const pathParts = event.path.split('/');
        const postId = pathParts[pathParts.length - 2]; // posts/{id}/like

        if (!postId || isNaN(postId)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Invalid post ID' })
            };
        }

        await client.connect();

        // Increment like count
        const result = await client.query(`
            UPDATE posts 
            SET likes = likes + 1 
            WHERE id = $1 
            RETURNING id, likes
        `, [postId]);

        if (result.rows.length === 0) {
            await client.end();
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: 'Post not found' })
            };
        }

        await client.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                post: result.rows[0]
            })
        };

    } catch (error) {
        console.error('Like post error:', error);
        
        if (client._connected) {
            await client.end();
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to like post'
            })
        };
    }
};