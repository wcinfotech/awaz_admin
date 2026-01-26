import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Reports from '../Reports';
import '@testing-library/jest-dom';

test('deep links to post tab via ?tab=post', async () => {
    render(
        <MemoryRouter initialEntries={["/reports?tab=post"]}>
            <Routes>
                <Route path="/reports" element={<Reports />} />
            </Routes>
        </MemoryRouter>
    );

    // The fallback data contains a POST with reason "False info" and a USER with reason "Spam".
    expect(await screen.findByText('False info')).toBeInTheDocument();
    expect(screen.queryByText('Spam')).not.toBeInTheDocument();
});