const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'testiblogi 1',
    author: 'Mie edelleen',
    url: 'www.fullstackopen/testia',
    likes: 9
  },
  {
    title: 'testiblogi 2',
    author: 'Mie edelleen',
    url: 'www.fullstackopen/testia',
    likes: 0
  }
]

//Get all blogs in a test database
const blogsInDatabase = async () => {
  const blogs = await Blog.find({})
  return blogs.map(b => b.toJSON())
}

//Get all users in a test database
const usersInDatabase = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const nonExistingId = async () => {
  const blog = new Blog({ title: 'test', url: 'www.test.fi' })
  await blog.save()
  await blog.remove()


  return blog._id.toString()
}

module.exports = {
  initialBlogs, blogsInDatabase,
  usersInDatabase, nonExistingId
}