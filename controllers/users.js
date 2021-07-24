const bcrypt = require('bcryptjs')
const usersRouter = require('express').Router()
const User = require('../models/user')

//Get all users
usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('blogs', { url: 1, title: 1, author: 1 })
  response.json(users.map(u => u.toJSON()))
})

//Post a user
usersRouter.post('/', async (request, response) => {
  if(request.body.password < 3 || request.body.password === undefined){
    response.status(400).json({ error: 'Password must be at least 3 chars long' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(request.body.password, saltRounds)

  const user = new User({
    username: request.body.username,
    name: request.body.name,
    passwordHash
  })

  const savedUser = await user.save()
  response.json(savedUser)
})

module.exports = usersRouter