const authService = require('../services/authService');

test('login should return user data for valid credentials', async () => {
	const userData = await authService.login('validUser', 'validPassword');
	expect(userData).toHaveProperty('id');
	expect(userData).toHaveProperty('name');
});

test('login should throw error for invalid credentials', async () => {
	await expect(authService.login('invalidUser', 'invalidPassword')).rejects.toThrow('Invalid credentials');
});