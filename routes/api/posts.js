const express = require('express');
const router = express.Router();
const { post } = require('request');
const User = require('../../models/User')
const Post = require('../../models/Post')
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

/**
 * @route   POST api/posts
 * @desc    Create a post
 * @access  Private
 */ 

router.post('/',
    [
        auth,
        [
            check('text', 'Text is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });

            const post = await newPost.save();
            return res.json(post);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
});

/**
 * @route   GET api/posts
 * @desc    Get all post
 * @access  Conditionaloy Public
 */ 
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET api/posts/:id
 * @desc    Get all post
 * @access  Conditionaloy Public
 */ 
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE api/posts/:id
 * @desc    Delete post
 * @access  Private
 */ 
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        /* Check user */
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();
        res.json({msg: 'Post removed'});
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT api/posts/like/:id
 * @desc    Like a post
 * @access  Private
 */ 
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        /* Check if it is already liked */
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.statis(400).json({ msg: 'Post already liked' });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT api/posts/unlike/:id
 * @desc    Unlike a post
 * @access  Private
 */ 
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        /* Check if it is already liked */
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.statis(400).json({ msg: 'Post has not yet liked' });
        }

        
        /* Get the remove index */
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);
        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST api/posts/comment/:id
 * @desc    Comments on a post
 * @access  Private
 */ 
router.post('/comment/:id',
    [
        auth,
        [
            check('text', 'Text is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const post = await Post.findById(req.params.id);

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };

            post.comments.unshift(newComment);
            await newComment.save();
            return res.json(post.comments);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
});

/**
 * @route   DELETE api/posts/comment/:id/:comment_id
 * @desc    Delete a comment
 * @access  Private
 */ 
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = Post.findById(req.params.id);

        /* Now pull out the comment */
        const comment = post.comment.find(comment => comment.id === req.params.comment_id);

        /* Make sure comments exists */
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        /* Check user */
        if (comment.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'User not authorized' });
        }
        
        /* Get the remove index */
        const removeIndex = post.comments.map(commet => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);
        await post.save();

        res.json(posts.comments);
    } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
})

module.exports = router;