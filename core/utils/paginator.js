export function paginator(items, current_page = 1, per_page_items = 10) {
	let page = current_page,
		per_page = per_page_items,
		offset = (page - 1) * per_page,
		paginatedItems = items.slice(offset, offset + per_page),
		total_pages = Math.ceil(items.length / per_page)

	return {
		page: page,
		per_page: per_page,
		prev_page: page - 1 > 0 ? page - 1 : null,
		next_page: total_pages > page ? page + 1 : null,
		total_files: items.length,
		total_pages: total_pages,
		data: paginatedItems,
	}
}
