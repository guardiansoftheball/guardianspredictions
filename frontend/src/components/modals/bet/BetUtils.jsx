import { API_URL } from '../../../config';

export const submitBet = (betData, token, onSuccess, onError) => {

    if (!token) {
        onError(new Error('Please log in to place a bet.'));
        return;
    }

    fetch(`${API_URL}/v0/bet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(betData),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                // Construct a new error object and throw it
                throw new Error(`Error placing bet: ${err.error || 'Unknown error'}`);
            });
        }
        return response.json();
    })
    .then(data => {
        onSuccess(data);  // Handle success outside this utility function
    })
    .catch(error => {
        onError(error);
    });
};
