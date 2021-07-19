const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const logger = require('../utils/logger')

// ** Event handlers of routes ** //

//Get blogs
blogsRouter.get('/', (request, response) => {
  Blog
    .find({})
    .then(blogs => {
      response.json(blogs)
    })
})

//Post a blog info
blogsRouter.post('/', (request, response) => {
  const blog = new Blog(request.body)

  logger.info(blog)
  
  blog
    .save()
    .then(savedBlog => {
      response.status(201).json(savedBlog)
    })
})

module.exports = blogsRouter