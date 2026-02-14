import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Register = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/users/register', { name: username, email, password });
            localStorage.setItem('token', res.data.token);
            if (typeof res.data.tokens_left === 'number') {
                localStorage.setItem('tokens_left', String(res.data.tokens_left));
            }
            navigate('/chat');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div className="register-container">
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Create Account</button>
            </form>
            {typeof onSwitch === 'function' && (
                <p className="auth-switch">
                    Already have an account?
                    <button type="button" onClick={onSwitch}>Sign in</button>
                </p>
            )}
        </div>
    );
};

export default Register;
