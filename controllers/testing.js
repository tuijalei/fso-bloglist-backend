const testingRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

// == Router for Cypress e2e testing == //

testingRouter.post('/reset', async (request, response) => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = testingRouter