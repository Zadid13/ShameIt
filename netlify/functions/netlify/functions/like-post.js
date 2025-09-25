const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'blog';

module.exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    let client;
    try {
        const { postId } = JSON.parse(event.body);

        if (!postId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing postId' }),
            };
        }

        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const posts = db.collection('posts');

        const result = await posts.findOneAndUpdate(
            { _id: postId },
            { $inc: { likes: 1 } },
            { returnDocument: 'after', upsert: false }
        );

        if (!result.value) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Post not found' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ likes: result.value.likes }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};