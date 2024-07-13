/**
 * Paginates an array of items and returns a paginated result object with previous and next items.
 * @param {Array<any>} items - The array of items to paginate.
 * @param {number} current_page - The current page number (default is 1).
 * @param {number} per_page_items - Number of items per page (default is 10).
 * @returns {Object} - A paginated result object containing page information, previous and next items, and paginated data.
 */
export function paginator(items, current_page = 1, per_page_items = 10) {
	let page = current_page,
		per_page = per_page_items,
		offset = (page - 1) * per_page,
		paginatedItems = items.slice(offset, offset + per_page), // Get items for the current page
		total_pages = Math.ceil(items.length / per_page), // Calculate total number of pages
		prev_item = offset > 0 ? items[offset - 1] : null, // Previous item or null if on the first page
		next_item = offset + per_page < items.length ? items[offset + per_page] : null // Next item or null if on the last page

	return {
		page: Number(page), // Current page number
		per_page: per_page, // Number of items per page
		prev_page: page > 1 ? Number(page) - 1 : null, // Previous page number or null if on the first page
		next_page: page < total_pages ? Number(page) + 1 : null, // Next page number or null if on the last page
		prev_item: prev_item, // Previous item in the array
		next_item: next_item, // Next item in the array
		total_items: items.length, // Total number of items
		total_pages: total_pages, // Total number of pages
		data: paginatedItems, // Items for the current page
	}
}
