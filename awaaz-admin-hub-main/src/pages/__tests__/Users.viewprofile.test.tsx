import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Users from '../Users';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { saveUsers, savePosts, saveEvents } from '@/lib/storage';

beforeEach(() => {
    saveUsers([{ id: 'u1', name: 'View User', email: 'view.user@example.com', role: 'user', status: 'active', joinedAt: new Date().toISOString() }]);
    savePosts([{ id: 'p1', user: 'View User', title: 'Hello world', datetime: new Date().toISOString() } as any]);
    saveEvents([{ id: 'e1', user: 'View User', title: 'Road blocked', datetime: new Date().toISOString() } as any]);
});

test('opens profile and shows posts count when viewing a user', async () => {
    render(<MemoryRouter><Users /></MemoryRouter>);

    // Wait for user row to appear
    expect(await screen.findByText('View User')).toBeInTheDocument();

    // open menu
    const menuButtons = screen.getAllByRole('button', { name: /more/i });
    // fallback: click the first action button in row
    userEvent.click(menuButtons[0]);

    // click view profile (menu item)
    const vp = await screen.findByText('View Profile');
    userEvent.click(vp);

    await waitFor(() => expect(screen.getByText('About')).toBeInTheDocument());
    expect(screen.getByText('Events created: 1')).toBeInTheDocument();
    expect(screen.getByText('General posts: 1')).toBeInTheDocument();
});