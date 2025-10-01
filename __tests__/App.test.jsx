import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders app without crashing', () => {
  render(<App />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});

test('app component has correct initial state', () => {
  render(<App />);
  // Check if the app container exists
  const appContainer = screen.getByTestId('app-container');
  expect(appContainer).toBeInTheDocument();
  
  // Check if app is visible
  expect(appContainer).toBeVisible();
});

test('app component renders with correct accessibility attributes', () => {
  render(<App />);
  
  // Check if the app has proper accessibility role
  const appElement = screen.getByRole('application');
  expect(appElement).toBeInTheDocument();
  
  // Check if app has accessible name
  expect(appElement).toHaveAccessibleName();
});

test('app component has proper CSS classes applied', () => {
  render(<App />);
  
  // Check if the app has expected CSS classes
  const appElement = screen.getByTestId('app-container');
  expect(appElement).toHaveClass('app', 'container');
  
  // Verify component styling
  expect(appElement).toHaveStyle({
    display: 'flex',
    minHeight: '100vh'
  });
});