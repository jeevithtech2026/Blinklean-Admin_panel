import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Partners from '../pages/Partners';
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

describe('Partners Integration Tests', () => {
  const fullMockPartners = [
    { id: 'P-101', name: 'Marcus Vance', category: 'Electronic Scrap', completedCount: 12, rating: 4.9, highestRatedService: 'Mainboard Shredding', earnings: 320.00 },
    { id: 'P-102', name: 'Aisha Rahman', category: 'Metal Extraction', completedCount: 15, rating: 4.8, highestRatedService: 'Copper Recovery', earnings: 450.00 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders partners list, category filters, and applies filter on dropdown selection', async () => {
    // Implement mock axios resolution depending on the requested category parameter
    axiosInstance.get.mockImplementation((url, config) => {
      const category = config?.params?.category;
      if (category === 'Electronic Scrap') {
        return Promise.resolve({
          data: [fullMockPartners[0]] // Return only Marcus Vance
        });
      }
      return Promise.resolve({
        data: fullMockPartners // Return both partners
      });
    });

    renderWithProviders(<Partners />);

    // 1. Verify initial full partner list loads successfully
    await waitFor(() => {
      expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
      expect(screen.getByText('Aisha Rahman')).toBeInTheDocument();
    });

    // 2. Change the category filter dropdown to "Electronic Scrap"
    const dropdownSelect = screen.getByRole('combobox');
    fireEvent.change(dropdownSelect, { target: { value: 'Electronic Scrap' } });

    // 3. Verify that the table updates, showing only filtered row matches
    await waitFor(() => {
      expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
      expect(screen.queryByText('Aisha Rahman')).not.toBeInTheDocument();
    });

    // 4. Assert that axios was invoked with the category query parameters
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/admin/partners/performance', {
      params: { category: 'Electronic Scrap' }
    });
  });
});
