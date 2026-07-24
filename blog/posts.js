/** Manual post registry — add an entry here when you create a new post folder. */
export const POSTS = [
  {
    slug: 'welcome-to-the-board',
    title: 'Welcome to the board',
    tags: ['other'],
    date: '2026-07-20',
    excerpt: 'First post — what this logbook is, how tags work, and why it looks like 2007.',
  },
]

export const ALL_TAGS = ['politics', 'creative', 'tech', 'sports', 'other']

export const AUTHOR = {
  username: 'Hashir',
  rank: 'Administrator',
  joinDate: 'Jul 2024',
  initials: 'HM',
}

export function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
