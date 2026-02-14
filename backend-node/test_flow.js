const API_URL = 'http://localhost:5000/api';

const runTest = async () => {
    try {
        console.log('--- Starting Test Flow ---');

        // 1. Register
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`\n1. Registering user: ${email}`);

        let response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email,
                password
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Registration failed: ${response.status} ${errorText}`);
        }

        let data = await response.json();
        const token = data.token;
        console.log('Registration successful, token received.');

        // 2. Chat
        console.log('\n2. Sending chat message...');
        response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({
                prompt: 'Hello, are you working?'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Chat failed: ${response.status} ${errorText}`);
        }

        data = await response.json();
        console.log('Chat response:', data.response);
        console.log('Tokens left:', data.tokens_left);

        console.log('\n--- Test Completed Successfully ---');

    } catch (err) {
        console.error('Test failed:', err.message);
    }
};

runTest();
