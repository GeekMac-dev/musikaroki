import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://tuhqpmuktfuxttqmjzam.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBhMGVlYjJjLTY4NDgtNGQzNS1iZjc1LWViZGFjMDA1ZmE1NSJ9.eyJwcm9qZWN0SWQiOiJ0dWhxcG11a3RmdXh0dHFtanphbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc3ODY0OTk5LCJleHAiOjIwOTMyMjQ5OTksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.XrYdOAeCUm_clltzYFy7HkeSjYft0At2CL5FmvbFtpw';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };