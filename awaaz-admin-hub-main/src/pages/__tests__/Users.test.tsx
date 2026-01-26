import { addReport, saveUsers, loadUsers, loadNotifications, saveReports } from '@/lib/storage';

beforeEach(() => {
    // reset storage
    saveUsers([
        { id: 'u-test', name: 'Test User', email: 'victim@example.com', role: 'user', status: 'active', joinedAt: new Date().toISOString() },
    ] as any);
    saveReports([]);
});

test('auto-blocks a user after repeated reports', () => {
    const email = 'victim@example.com';

    addReport({ id: 'r1', type: 'USER', reason: 'Spam', createdAt: new Date().toISOString(), status: 'OPEN', targetUserEmail: email });
    let users = loadUsers() as any[];
    expect(users.find((u) => u.email === email).status).toBe('active');

    addReport({ id: 'r2', type: 'USER', reason: 'Harassment', createdAt: new Date().toISOString(), status: 'OPEN', targetUserEmail: email });
    users = loadUsers() as any[];
    expect(users.find((u) => u.email === email).status).toBe('active');

    addReport({ id: 'r3', type: 'USER', reason: 'Multiple violations', createdAt: new Date().toISOString(), status: 'OPEN', targetUserEmail: email });
    users = loadUsers() as any[];
    const victim = users.find((u) => u.email === email);
    expect(victim.status).toBe('inactive');
    expect(victim.blockedBy).toBe('auto');
    expect(victim.blockedAt).toBeTruthy();

    const notifs = loadNotifications() || [];
    expect(notifs.find((n) => n.to === email)).toBeTruthy();
});