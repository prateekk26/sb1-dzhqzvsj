import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextArea } from '../TextArea';
import { FileText } from 'lucide-react';
import { vi } from 'vitest';

describe('TextArea Component', () => {
  const defaultProps = {
    name: 'description',
    value: '',
    onChange: vi.fn(),
    label: 'Description',
    placeholder: 'Enter description',
  };

  test('renders with required props', () => {
    render(<TextArea {...defaultProps} />);
    
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  test('renders icon when provided', () => {
    render(<TextArea {...defaultProps} icon={FileText} />);
    
    // Since Lucide icons are SVGs, we can check for their presence
    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  test('handles input changes', () => {
    const handleChange = vi.fn();
    render(<TextArea {...defaultProps} onChange={handleChange} />);
    
    const textarea = screen.getByLabelText('Description');
    fireEvent.change(textarea, { target: { value: 'Test description' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'Test description' })
    }));
  });

  test('displays error message when provided', () => {
    render(<TextArea {...defaultProps} error="Description is too short" />);
    
    expect(screen.getByText('Description is too short')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
  });

  test('displays help text when provided and no error', () => {
    render(<TextArea {...defaultProps} helpText="Provide a detailed description" />);
    
    expect(screen.getByText('Provide a detailed description')).toBeInTheDocument();
  });

  test('prioritizes error over help text', () => {
    render(
      <TextArea 
        {...defaultProps} 
        error="Description is too short" 
        helpText="Provide a detailed description" 
      />
    );
    
    expect(screen.getByText('Description is too short')).toBeInTheDocument();
    expect(screen.queryByText('Provide a detailed description')).not.toBeInTheDocument();
  });

  test('shows optional label when specified', () => {
    render(<TextArea {...defaultProps} optional />);
    
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  test('applies custom number of rows', () => {
    render(<TextArea {...defaultProps} rows={8} />);
    
    expect(screen.getByLabelText('Description')).toHaveAttribute('rows', '8');
  });

  test('calls onBlur handler when textarea loses focus', () => {
    const handleBlur = vi.fn();
    render(<TextArea {...defaultProps} onBlur={handleBlur} />);
    
    const textarea = screen.getByLabelText('Description');
    fireEvent.blur(textarea);
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('applies validation on blur if provided', () => {
    const mockValidation = vi.fn().mockReturnValue({ valid: false, message: 'Invalid input' });
    const handleBlur = vi.fn();
    
    render(
      <TextArea 
        {...defaultProps} 
        value="test" 
        validation={mockValidation} 
        onBlur={handleBlur} 
      />
    );
    
    const textarea = screen.getByLabelText('Description');
    fireEvent.blur(textarea);
    
    expect(mockValidation).toHaveBeenCalledWith('test');
    expect(handleBlur).toHaveBeenCalled();
  });

  test('displays character count when maxLength is provided', () => {
    render(<TextArea {...defaultProps} value="Hello" maxLength={100} />);
    
    expect(screen.getByText('5/100 characters')).toBeInTheDocument();
  });

  test('changes character count color when approaching limit', () => {
    const { rerender } = render(
      <TextArea {...defaultProps} value="Hello" maxLength={10} />
    );
    
    // Not near limit yet
    let countElement = screen.getByText('5/10 characters');
    expect(countElement).not.toHaveClass('text-yellow-400');
    expect(countElement).not.toHaveClass('text-red-400');
    
    // Near limit (80%)
    rerender(<TextArea {...defaultProps} value="12345678" maxLength={10} />);
    countElement = screen.getByText('8/10 characters');
    expect(countElement).toHaveClass('text-yellow-400');
    
    // At limit
    rerender(<TextArea {...defaultProps} value="1234567890" maxLength={10} />);
    countElement = screen.getByText('10/10 characters');
    expect(countElement).toHaveClass('text-red-400');
  });
});