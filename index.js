const express = require('express');
const axios = require('axios');
const cors = require('cors');
const _ = require('lodash');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

let blogData = null;

// Middleware to fetch and analyze blog data
const fetchAndAnalyzeBlogData = async (req, res, next) => {
    if (!blogData) {
        try {
            const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
                headers: {
                    'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
                },
            });
            blogData = response.data?.blogs;
        } catch (error) {
            console.error('Error fetching blog data:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

    }

    next();
};

// Route to get blog statistics
app.get('/api/blog-stats', fetchAndAnalyzeBlogData, (req, res) => {
    try {
        if (!blogData) {
            throw new Error('Blog data is not available.');
        }

        const totalBlogs = _.size(blogData);
        const longestBlog = _.maxBy(blogData, (blog) => blog.title.length);
        const blogsWithPrivacy = _.filter(blogData, (blog) =>
            blog?.title && blog?.title.toLowerCase().includes('privacy')
        );
        const uniqueBlogTitles = _.uniqBy(blogData, 'title');

        res.json({
            totalBlogs,
            longestBlog: longestBlog?.title,
            blogsWithPrivacy: blogsWithPrivacy?.length,
            numberOfUniqueTitel: uniqueBlogTitles?.length,
            uniqueBlogTitles: uniqueBlogTitles.map((blog) => blog?.title),
        });
    } catch (error) {
        console.error('Error in blog-stats route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// console.log('Fetched blog data:', blogData);

// Route for blog search
app.get('/api/blog-search', fetchAndAnalyzeBlogData, (req, res) => {
    const query = req.query.query || '';

    try {
        if (!blogData) {
            throw new Error('Blog data is not available.');
        }

        // Perform the search by filtering the blogData based on the query string
        const searchResults = _.filter(blogData, (blog) =>
            blog.title && blog.title.toLowerCase().includes(query.toLowerCase())
        );

        res.json(searchResults);
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
