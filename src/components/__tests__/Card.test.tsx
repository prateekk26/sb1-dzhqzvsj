import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../Card';
import { vi } from 'vitest';

describe('Card Components', () => {
  describe('Card Component', () => {
    test('renders children correctly', () => {
      render(
        <Card>
          <div data-testid="card-child">Card Content</div>
        </Card>
      );
      
      expect(screen.getByTestId('card-child')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('bg-gray-800'); // Default class
    });

    test('handles onClick event', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      
      fireEvent.click(screen.getByText('Clickable Card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('adds cursor-pointer class when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      
      const card = screen.getByText('Clickable Card').parentElement;
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('CardHeader Component', () => {
    test('renders children correctly', () => {
      render(
        <CardHeader>
          <div data-testid="header-child">Header Content</div>
        </CardHeader>
      );
      
      expect(screen.getByTestId('header-child')).toBeInTheDocument();
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);
      
      const header = screen.getByText('Header').parentElement;
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('mb-4'); // Default class
    });
  });

  describe('CardTitle Component', () => {
    test('renders children correctly', () => {
      render(<CardTitle>Card Title</CardTitle>);
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('text-xl'); // Default class
    });
  });

  describe('CardDescription Component', () => {
    test('renders children correctly', () => {
      render(<CardDescription>Card Description</CardDescription>);
      
      expect(screen.getByText('Card Description')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);
      
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('custom-desc');
      expect(desc).toHaveClass('text-gray-400'); // Default class
    });
  });

  describe('CardContent Component', () => {
    test('renders children correctly', () => {
      render(
        <CardContent>
          <div data-testid="content-child">Content</div>
        </CardContent>
      );
      
      expect(screen.getByTestId('content-child')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);
      
      const content = screen.getByText('Content').parentElement;
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter Component', () => {
    test('renders children correctly', () => {
      render(
        <CardFooter>
          <div data-testid="footer-child">Footer Content</div>
        </CardFooter>
      );
      
      expect(screen.getByTestId('footer-child')).toBeInTheDocument();
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);
      
      const footer = screen.getByText('Footer').parentElement;
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('mt-4'); // Default class
    });
  });

  describe('Card Component Integration', () => {
    test('renders full card structure correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});