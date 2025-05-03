import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '../FormInput';
import { Mail } from 'lucide-react';
import { vi } from 'vitest';

describe('FormInput Component', () => {
  const defaultProps = {
    name: 'email',
    value: '',
    onChange: vi.fn(),
    label: 'Email',
    placeholder: 'Enter your email',
    icon: Mail,
  };

  test('renders with required props', () => {
    render(<FormInput {...defaultProps} />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  test('renders icon when provided', () => {
    render(<FormInput {...defaultProps} />);
    
    // Since Lucide icons are SVGs, we can check for their presence
    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  test('handles input changes', () => {
    const handleChange = vi.fn();
    render(<FormInput {...defaultProps} onChange={handleChange} />);
    
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'test@example.com' })
    }));
  });

  test('displays error message when provided', () => {
    render(<FormInput {...defaultProps} error="Invalid email format" />);
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('displays help text when provided and no error', () => {
    render(<FormInput {...defaultProps} helpText="We'll never share your email" />);
    
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  test('prioritizes error over help text', () => {
    render(
      <FormInput 
        {...defaultProps} 
        error="Invalid email format" 
        helpText="We'll never share your email" 
      />
    );
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.queryByText("We'll never share your email")).not.toBeInTheDocument();
  });

  test('shows optional label when specified', () => {
    render(<FormInput {...defaultProps} optional />);
    
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  test('calls onBlur handler when input loses focus', () => {
    const handleBlur = vi.fn();
    render(<FormInput {...defaultProps} onBlur={handleBlur} />);
    
    const input = screen.getByLabelText('Email');
    fireEvent.blur(input);
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('applies validation on blur if provided', () => {
    const mockValidation = vi.fn().mockReturnValue({ valid: false, message: 'Invalid input' });
    const handleBlur = vi.fn();
    
    render(
      <FormInput 
        {...defaultProps} 
        value="test" 
        validation={mockValidation} 
        onBlur={handleBlur} 
      />
    );
    
    const input = screen.getByLabelText('Email');
    fireEvent.blur(input);
    
    expect(mockValidation).toHaveBeenCalledWith('test');
    expect(handleBlur).toHaveBeenCalled();
  });

  test('applies different input types', () => {
    const { rerender } = render(<FormInput {...defaultProps} type="password" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'password');
    
    rerender(<FormInput {...defaultProps} type="number" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'number');
  });
});