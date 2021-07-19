const listHelper = require('../utils/list_helper').dummy

test('dummy returns one', () => {
  const blogs = []
  expect(listHelper(blogs)).toBe(1)
})