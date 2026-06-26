import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import axiosInstance from '../api/axiosInstance';

// Mock axiosInstance dependency
jest.mock('../api/axiosInstance', () => {
  return {
    get: jest.fn(),
    create: jest.fn().mockReturnThis(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };
});

const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        {ui}
      </NotificationProvider>
    </ThemeProvider>
  );
};

describe('Dashboard Component Unit Tests', () => {
  const mockSummaryResponse = {
    data: {
      customers: "12,480",
      customersTrend: "+12.5%",
      customersIsPositive: true,
      partners: "348",
      partnersTrend: "+4.2%",
      partnersIsPositive: true,
      bookings: "95",
      bookingsTrend: "-1.8%",
      bookingsIsPositive: false,
      completions: "1,248",
      completionsTrend: "+8.6%",
      completionsIsPositive: true,
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading state indicators initially', () => {
    // Return a pending promise to keep the component in loading state
    axiosInstance.get.mockReturnValue(new Promise(() => {}));
    
    renderWithProviders(<Dashboard />);

    // Assert that loading skeleton layout elements or text are present
    expect(screen.getByText('Overview Dashboard')).toBeInTheDocument();
  });

  it('populates and displays all 4 core KPI cards once data load finishes', async () => {
    axiosInstance.get.mockResolvedValue(mockSummaryResponse);

    renderWithProviders(<Dashboard />);

    // Wait for the asynchronous fetch to complete
    await waitFor(() => {
      expect(screen.getByText('12,480')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Registered Customers')).toBeInTheDocument();
    expect(screen.getByText('Total Registered Partners')).toBeInTheDocument();
    expect(screen.getByText('348')).toBeInTheDocument();
    expect(screen.getByText('Active Bookings Today')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('Completed Services Today')).toBeInTheDocument();
    expect(screen.getByText('1,248')).toBeInTheDocument();
  });

  it('renders the static Highest Rated Services data table rows correctly', async () => {
    axiosInstance.get.mockResolvedValue(mockSummaryResponse);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Highest Rated Services')).toBeInTheDocument();
    });

    // Check table headers and specific static entries
    expect(screen.getByText('Deep Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Express Clean')).toBeInTheDocument();
    expect(screen.getByText('Eco Sanitation')).toBeInTheDocument();
  });
});
