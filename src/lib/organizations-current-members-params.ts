/** Issue #16：当前组织成员目录 API 与前端约定 */

export const ORGANIZATIONS_CURRENT_MEMBERS_PAGE_SIZE = 20

export const ORGANIZATIONS_CURRENT_MEMBERS_SEARCH_DEBOUNCE_MS = 300

export function parseOrganizationsCurrentMembersPageQuery(searchParams: URLSearchParams): {
  page: number
  q: string
} {
  const rawPage = searchParams.get('page')
  let page = 1
  if (rawPage != null && rawPage !== '') {
    const n = Number(rawPage)
    if (Number.isFinite(n) && n >= 1 && Number.isInteger(n)) page = n
  }
  return { page, q: (searchParams.get('q') ?? '').trim() }
}
