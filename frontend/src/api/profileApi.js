import { authenticatedApiRequest } from './httpClient';

const post = (path, body) => authenticatedApiRequest(`/v0/profilechange/${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const updateEmoji = (emoji) => post('emoji', { emoji });
export const updateDisplayName = (displayName) => post('displayname', { displayName });
export const updateDescription = (description) => post('description', { description });
export const updateLinks = (links) => post('links', links);
