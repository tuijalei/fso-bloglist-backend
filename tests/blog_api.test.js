const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcryptjs')
const app = require('../app')
const helper = require('../tests/test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)
let loggedInToken

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)

  //Init user
  let passwordHash = await bcrypt.hash('testing', 10)
  let userObj = new User({
    username: 'test_user',
    passwordHash
  })
  await userObj.save()

  //Logging in with the user to get token
  const loggingIn = await api
    .post('/api/login')
    .send({
      username: 'test_user',
      password: 'testing'
    })
    .expect(200)

  loggedInToken = loggingIn.body.token
})

// === BLOG TESTS === ///

describe('Tests for a blog list', () => {

  test('all blogs are json type', async() => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('get all blogs', async () => {
    const result = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(result.body).toHaveLength(helper.initialBlogs.length)
  })

  test('all blogs have an id', async () => {
    const blogs = await api
      .get('/api/blogs')
      .expect(200)

    const allIds = blogs.body.map(b => b.id)

    expect(allIds).toBeDefined()
  })

})

describe('Tests for viewing a specific blog', () => {

  test('succeeded with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDatabase()
    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const processedBlog = JSON.parse(JSON.stringify(blogToView))
    expect(resultBlog.body).toEqual(processedBlog)
  })

  test('statuscode 404, if a blog doesn`t exist', async () => {
    const validNonExistingId = await helper.nonExistingId()

    await api
      .get(`/api/blogs/${validNonExistingId}`)
      .expect(404)
  })

  test('statuscode 400, if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a59k2'

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400)
  })

})

describe('Tests for updating a blog', () => {

  test('a blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDatabase()
    const blogToUpdate = blogsAtStart[0]

    const updates = {
      title: blogToUpdate.title,
      author: blogToUpdate.author,
      url: blogToUpdate.url,
      likes: blogToUpdate.likes + 10
    }

    const updatedBlog = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updates)
      .expect(200)

    expect(updatedBlog.body.likes).toEqual(blogToUpdate.likes + 10)
  })

})

describe('Tests for addition of a blog', () => {

  test('a blog can be added', async () => {
    const newBlog = {
      title: 'testiblogi 3',
      author: 'Mie edelleen',
      url: 'www.fullstackopen/testia',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: `bearer ${loggedInToken}` })
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const allBlogsAfter = await helper.blogsInDatabase()
    const cont = allBlogsAfter.map(b => b.title)

    //Expecting the length of blog list grow by 1 after adding a new blog
    expect(allBlogsAfter).toHaveLength(helper.initialBlogs.length + 1)

    //Expecting updated blog to have the title of added blog
    expect(cont).toContainEqual('testiblogi 3')
  })

  test('can`t add a blog without proper token', async () => {
    const newBlog = {
      title: 'testiblogi 3',
      author: 'Mie edelleen',
      url: 'www.fullstackopen/testia',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: 'bearer invalidToken' })
      .send(newBlog)
      .expect(401)

    const allBlogsAfter = await helper.blogsInDatabase()
    const cont = allBlogsAfter.map(b => b.title)

    //Length should be the same than at the beginning
    expect(allBlogsAfter).toHaveLength(helper.initialBlogs.length)

    //Addition of a blog never happened
    expect(cont).not.toContainEqual('testiblogi 3')
  })

  test('if likes not set, set the property to zero', async () => {
    const blog = {
      title: 'uusi yritys',
      author: 'Miehän se',
      url: 'www.fullstackopen/testia2'
    }

    const addedBlog = await api
      .post('/api/blogs')
      .set({ Authorization: `bearer ${loggedInToken}` })
      .send(blog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(addedBlog.body.likes).toBe(0)

  })

  test('statuscode 400, if a blog does not have a title or url', async () => {
    const blog = {
      author: 'Mie',
      likes: 7
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: `bearer ${loggedInToken}` })
      .send(blog)
      .expect(400)
  })

})

describe('Tests for deleting a blog', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    const blogOwner = await User.find({ username: 'test_user' })

    const blog = new Blog({
      title: 'Deleting a blog',
      author: 'test user',
      url: 'www.testing.com',
      likes: 0,
      user: blogOwner[0]._id
    })

    await blog.save()

  })

  test('a blog can be deleted', async() => {
    const blogsAtStart = await helper.blogsInDatabase()
    const blogToDelete = blogsAtStart[0]

    //Right statuscode
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set({ Authorization: `bearer ${loggedInToken}` })
      .expect(204)

    //Shorter list than blogsAtStart
    const blogsAtEnd = await helper.blogsInDatabase()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

    //Doesn't have the content of the deleted blog
    const cont = blogsAtEnd.map(b => b.title)
    expect(cont).not.toContainEqual(blogToDelete.title)
  })

  test('statuscode 401, if token missing or invalid', async() => {
    const blogsAtStart = await helper.blogsInDatabase()
    const blogToDelete = blogsAtStart[0]

    //Right statuscode
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set({ Authorization: 'bearer invalidToken' })
      .expect(401)

    //Length's the same than at the beginning
    const blogsAtEnd = await helper.blogsInDatabase()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

    //Still has the content of deleted blog
    const cont = blogsAtEnd.map(b => b.title)
    expect(cont).toContainEqual(blogToDelete.title)
  })

})

// === USER TESTS === //

describe('Tests for user handling', () => {

  test('a valid user can be added', async () => {
    const usersAtStart = await helper.usersInDatabase()

    const newUser = {
      username: 'mikkis',
      name: 'Testi Mikkis',
      password: 'secret123'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    //Length should get bigger by one
    const usersAtEnd = await helper.usersInDatabase()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    //Updated user list should contain the new user's username
    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('statuscode 400, when invalid data', async () => {
    const newUser = {
      username: 'mo',
      name: 'Mikko Moikkanen',
      password: 's'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
  })

})

afterAll(() => {
  mongoose.connection.close()
})
