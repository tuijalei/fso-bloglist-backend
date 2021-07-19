const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

//Check out all likes from a blog list
const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog
  }

  return blogs.length === 0
    ? 0
    : blogs.map(b => b.likes).reduce(reducer, 0)
}

//Check out the fav blog from a blog list
const favoriteBlog = (blogs) => {
  const reducer = (prev, curr) => {
    return prev.likes > curr.likes ? prev : curr
  }

  const fav = blogs.filter(b => b.likes).reduce(reducer, 0)
  const result = (({ title, author, likes }) => ({ title, author, likes }))(fav)

  return blogs.length === 0
    ? {}
    : result
}

//Check out which author has most blogs
const mostBlogs = (blogs) => {
  const blogArray = (_(blogs).countBy('author').entries().max())

  return blogs.length === 0
    ? {}
    : _.assignIn({ 'author': blogArray[0], 'blogs': blogArray[1] })
}

//Check out which author has most likes
const mostLikes = (blogs) => {
  const countLikes = blogs.reduce((acc, curr) => {
    acc[curr.author] = acc[curr.author] ? acc[curr.author] + curr.likes : curr.likes
    return acc
  }, {})

  const result = Object.entries(countLikes).sort(([,a],[,b]) => b - a )

  return blogs.length === 0
    ? {}
    : _.assignIn({ 'author': result[0].slice()[0], 'likes': result[0].slice()[1] })
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}