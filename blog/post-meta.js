import { POSTS, AUTHOR } from './posts.js'

document.querySelectorAll('[data-post-count]').forEach((el) => {
  el.textContent = String(POSTS.length)
})

document.querySelectorAll('[data-author-join]').forEach((el) => {
  el.textContent = AUTHOR.joinDate
})
