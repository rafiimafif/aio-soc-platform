import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';

// Polyfill Web Crypto API for JSDOM environment
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}

// Mock Recharts completely to avoid SVG rendering and container size errors in jsdom
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }) => <div data-testid="mock-responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="mock-bar-chart">{children}</div>,
    Bar: () => <div data-testid="mock-bar" />,
    XAxis: () => <div data-testid="mock-x-axis" />,
    YAxis: () => <div data-testid="mock-y-axis" />,
    LineChart: ({ children }) => <div data-testid="mock-line-chart">{children}</div>,
    Line: () => <div data-testid="mock-line" />,
    PieChart: ({ children }) => <div data-testid="mock-pie-chart">{children}</div>,
    Pie: () => <div data-testid="mock-pie" />,
    Cell: () => <div data-testid="mock-cell" />,
    CartesianGrid: () => <div data-testid="mock-grid" />,
    Tooltip: () => <div data-testid="mock-tooltip" />,
  };
});
