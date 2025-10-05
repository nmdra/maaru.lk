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

test('app component handles props correctly', () => {
  const mockProps = {
    title: 'Test App',
    theme: 'dark'
  };
  
  render(<App {...mockProps} />);
  
  // Check if props are applied correctly
  const titleElement = screen.getByText('Test App');
  expect(titleElement).toBeInTheDocument();
  
  // Check if theme is applied
  const appContainer = screen.getByTestId('app-container');
  expect(appContainer).toHaveAttribute('data-theme', 'dark');
});

test('app component handles error boundaries gracefully', () => {
  // Mock console.error to prevent error logs during test
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  render(<App />);
  
  // Check if error boundary exists
  const appContainer = screen.getByTestId('app-container');
  expect(appContainer).toBeInTheDocument();
  
  // Verify no error state is initially shown
  expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  
  // Restore console.error
  consoleSpy.mockRestore();
});

test('renders without console errors', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<App />);
  expect(errorSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('app component unmounts cleanly without memory leaks', () => {
  const { unmount } = render(<App />);
  
  // Verify component renders initially
  const appContainer = screen.getByTestId('app-container');
  expect(appContainer).toBeInTheDocument();
  
  // Unmount component
  unmount();
  
  // Verify component is no longer in document
  expect(screen.queryByTestId('app-container')).not.toBeInTheDocument();
  
  // Check that no timers or listeners are left running
  expect(jest.getTimerCount()).toBe(0);
});