import React, { useState } from 'react';
import { pageSize as defaultPageSize } from '../config_variable';

const Pagination = ({
	currentPage,
	totalPages,
	onPageChange,
	totalRecords,
	onPageSizeChange
}) => {
	const range = 5; 
	const startPage = Math.max(1, currentPage - range);
	const endPage = Math.min(totalPages, currentPage + range);
	const [inputPageSize, setInputPageSize] = useState(defaultPageSize);
	const [showCustomInput, setShowCustomInput] = useState(false);

	const handlePageChange = (page) => {
		if (page >= 1 && page <= totalPages) {
			onPageChange(page);
		}
	};

	const handlePageSizeChange = (newSize) => {
		if (newSize > 0) {
			onPageSizeChange(newSize);
			setInputPageSize(newSize);
			setShowCustomInput(false);
		}
	};

	const handleCustomPageSize = () => {
		const newSize = Number(inputPageSize);
		if (newSize > 0) {
			onPageSizeChange(newSize);
			setShowCustomInput(false);
		}
	};

	const renderPaginationItems = () => {
		const items = [];
		
		// First page button
		if (currentPage > range + 1) {
			items.push(
				<li key='first' className='page-item'>
					<button 
						className='page-link' 
						onClick={() => handlePageChange(1)}
						title="Go to first page"
					>
						1
					</button>
				</li>
			);
		}

		// Previous ellipsis
		if (startPage > 2) {
			items.push(
				<li key='prev-ellipsis' className='page-item disabled'>
					<span className='page-link text-muted'>...</span>
				</li>
			);
		}

		// Page number buttons
		for (let i = startPage; i <= endPage; i++) {
			items.push(
				<li
					key={i}
					className={`page-item ${i === currentPage ? 'active' : ''}`}
				>
					<button 
						className={`page-link ${i === currentPage ? 'fw-bold' : ''}`}
						onClick={() => handlePageChange(i)}
						title={`Go to page ${i}`}
					>
						{i}
					</button>
				</li>
			);
		}

		// Next ellipsis
		if (endPage < totalPages - 1) {
			items.push(
				<li key='next-ellipsis' className='page-item disabled'>
					<span className='page-link text-muted'>...</span>
				</li>
			);
		}

		// Last page button
		if (currentPage < totalPages - range) {
			items.push(
				<li key='last' className='page-item'>
					<button
						className='page-link'
						onClick={() => handlePageChange(totalPages)}
						title="Go to last page"
					>
						{totalPages}
					</button>
				</li>
			);
		}

		return items;
	};

	return (
		<nav aria-label='Page navigation'>
			<div className='d-flex flex-column flex-lg-row justify-content-between align-items-center py-3 px-3 border-top'>
				{/* Page Size Controls - Left side on desktop, top on mobile */}
				<div className='d-flex align-items-center mb-3 mb-lg-0 order-2 order-lg-1'>
					<span className='text-muted me-2 small fw-medium'>Show:</span>
					{!showCustomInput ? (
						<select
							value={inputPageSize}
							onChange={(e) => {
								const value = e.target.value;
								if (value === 'custom') {
									setShowCustomInput(true);
								} else {
									handlePageSizeChange(Number(value));
								}
							}}
							className='form-select form-select-sm me-2'
							style={{ width: '85px' }}
						>
							<option value={5}>5</option>
							<option value={10}>10</option>
							<option value={12}>12</option>
							<option value={15}>15</option>
							<option value={20}>20</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
							<option value="custom">Custom</option>
						</select>
					) : (
						<div className='d-flex align-items-center me-2'>
							<input
								type='number'
								value={inputPageSize}
								onChange={(e) => setInputPageSize(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										handleCustomPageSize();
									}
								}}
								onBlur={handleCustomPageSize}
								style={{ width: '70px' }}
								className='form-control form-control-sm me-1'
								min="1"
								autoFocus
								placeholder="Size"
							/>
							<button
								className='btn btn-sm btn-success me-1'
								onClick={handleCustomPageSize}
								title="Apply"
							>
								<i className='bi bi-check'></i>
							</button>
							<button
								className='btn btn-sm btn-outline-secondary'
								onClick={() => {
									setShowCustomInput(false);
									setInputPageSize(defaultPageSize);
								}}
								title="Cancel"
							>
								<i className='bi bi-x'></i>
							</button>
						</div>
					)}
					<span className='text-muted'>per page</span>
				</div>

				{/* Pagination Controls - Center */}
				<div className='d-flex flex-column align-items-center order-2 order-lg-2'>
					{/* Records Info */}
					<div className='text-center mb-2'>
						<span className='text-muted small'>
							{totalRecords > 0 ? (
								<>
									Showing <strong>{Math.min((currentPage - 1) * inputPageSize + 1, totalRecords)}</strong> to{' '}
									<strong>{Math.min(currentPage * inputPageSize, totalRecords)}</strong> of{' '}
									<strong>{totalRecords}</strong> results
								</>
							) : (
								<span className='text-warning'>No results found</span>
							)}
						</span>
					</div>
					
					{/* Pagination Controls */}
					<div className='d-flex justify-content-center'>
						<ul className='pagination pagination-sm mb-0'>
							<li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
								<button
									className='page-link'
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1}
									title="Previous page"
								>
									<i className='bi bi-chevron-left'></i>
								</button>
							</li>
							{renderPaginationItems()}
							<li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
								<button
									className='page-link'
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages}
									title="Next page"
								>
									<i className='bi bi-chevron-right'></i>
								</button>
							</li>
						</ul>
					</div>
				</div>

				{/* Empty right space for balance */}
				<div className='order-3 order-lg-3' style={{minWidth: '200px'}}></div>
			</div>
		</nav>
	);
};

export default Pagination;
