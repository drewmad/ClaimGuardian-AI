import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  it('renders correctly with default props', () => {
    render(<Pagination currentPage={1} totalPages={5} />);
    
    // Check that prev button is disabled (because we're on page 1)
    const prevButton = screen.getByText('Previous', { selector: 'span.sr-only' }).parentElement;
    expect(prevButton).toHaveClass('cursor-not-allowed');
    
    // Check that next button is enabled
    const nextButton = screen.getByText('Next', { selector: 'span.sr-only' }).parentElement;
    expect(nextButton).not.toHaveClass('cursor-not-allowed');
    
    // Check page numbers are displayed
    for (let i = 1; i <= 5; i++) {
      const pageButton = screen.getByText(i.toString());
      expect(pageButton).toBeInTheDocument();
      
      // Current page should have active styling
      if (i === 1) {
        expect(pageButton).toHaveClass('bg-blue-600');
      } else {
        expect(pageButton).not.toHaveClass('bg-blue-600');
      }
    }
  });

  it('does not render when totalPages is 1', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onPageChange when page button is clicked', () => {
    const mockOnPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    // Click on page 5
    fireEvent.click(screen.getByText('5'));
    expect(mockOnPageChange).toHaveBeenCalledWith(5);
    
    // Click on previous button
    const prevButton = screen.getByText('Previous', { selector: 'span.sr-only' }).parentElement;
    fireEvent.click(prevButton!);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
    
    // Click on next button
    const nextButton = screen.getByText('Next', { selector: 'span.sr-only' }).parentElement;
    fireEvent.click(nextButton!);
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('renders correctly for many pages with ellipsis', () => {
    render(<Pagination currentPage={5} totalPages={20} />);
    
    // Should show first page
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Should show ellipsis
    expect(screen.getAllByText('...').length).toBe(2);
    
    // Should show current page and neighbors
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    
    // Should show last page
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} />);
    
    const nextButton = screen.getByText('Next', { selector: 'span.sr-only' }).parentElement;
    expect(nextButton).toHaveClass('cursor-not-allowed');
  });

  it('hides page numbers when showPageNumbers is false', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={10}
        showPageNumbers={false}
      />
    );
    
    // Should not show any page numbers
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    
    // But prev/next buttons should be present
    expect(screen.getByText('Previous', { selector: 'span.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('Next', { selector: 'span.sr-only' })).toBeInTheDocument();
  });
}); 