import { POSTS, ALL_TAGS, formatDate } from './posts.js'

const tbody = document.querySelector('#thread-list')
const threadCountEl = document.querySelector('#stat-threads')
const filterBar = document.querySelector('#tag-filter')
let activeTag = 'all'

function tagPills(tags) {
  return tags
    .map((tag) => `<span class="tag-pill tag--${tag}">${tag}</span>`)
    .join('')
}

function filteredPosts() {
  if (activeTag === 'all') return POSTS
  return POSTS.filter((post) => post.tags.includes(activeTag))
}

function renderThreads() {
  const posts = filteredPosts()
  threadCountEl.textContent = String(POSTS.length)

  if (posts.length === 0) {
    tbody.innerHTML = `
      <tr class="thread-empty">
        <td colspan="4">No threads match this tag. Try another filter.</td>
      </tr>
    `
    return
  }

  // Newest first
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date))

  tbody.innerHTML = sorted
    .map((post, i) => {
      const alt = i % 2 === 0 ? 'alt1' : 'alt2'
      return `
        <tr class="${alt}" data-tags="${post.tags.join(' ')}">
          <td class="thread-icon" title="Thread">◈</td>
          <td>
            <div class="thread-title">
              <a href="/blog/posts/${post.slug}/">${post.title}</a>
            </div>
            <div>${tagPills(post.tags)}</div>
            <span class="thread-excerpt">${post.excerpt}</span>
          </td>
          <td class="thread-meta">Hashir</td>
          <td class="thread-meta">${formatDate(post.date)}</td>
        </tr>
      `
    })
    .join('')
}

function renderFilterChips() {
  const chips = [
    `<button type="button" class="tag-chip is-active" data-tag="all">all</button>`,
    ...ALL_TAGS.map(
      (tag) =>
        `<button type="button" class="tag-chip" data-tag="${tag}">${tag}</button>`,
    ),
  ]
  filterBar.innerHTML = `
    <span class="tag-filter__label">Filter by tag</span>
    ${chips.join('')}
  `

  filterBar.addEventListener('click', (event) => {
    const btn = event.target.closest('.tag-chip')
    if (!btn) return
    activeTag = btn.dataset.tag
    filterBar.querySelectorAll('.tag-chip').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.tag === activeTag)
    })
    renderThreads()
  })
}

renderFilterChips()
renderThreads()
