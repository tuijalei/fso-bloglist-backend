const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const userExtractor = require('../utils/middleware').userExtractor

//Get all blogs
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs.map(b => b.toJSON()))

})

//Get a blog by id
blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if(blog) {
    response.json(blog.toJSON())
  } else {
    response.status(404).end()
  }
})

//Post a blog
blogsRouter.post('/', userExtractor, async (request, response) => {
  const user = await User.findById(request.user.id)
  const body = request.body
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined? 0 : body.likes,
    user: user._id
  })

  //If title nor url are set, statuscode 400
  if (!blog.title || !blog.url){
    return response.status(400).json({ error: 'title or url missing' }).end()
  }

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

//Delete a blog
blogsRouter.delete('/:id', userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  const user = await User.findById(request.user.id)

  //Must be the blog's owner to delete it
  if(blog.user.toString() === user.id.toString()){
    await blog.remove()
    user.blogs = user.blogs.filter(b => b.id.toString() !== request.params.id.toString())
    await user.save()
    response.status(204).end()
  } else {
    response.status(400).json({ error: 'user is wrong' })
  }
})

//Update a blog
blogsRouter.put('/:id', async (request, response) => {
  const blog = {
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes
  }

  console.log(request.body)

  await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })

  response.json(blog)
})

module.exports = blogsRouter