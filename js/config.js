// js/config.js
const SUPABASE_URL = 'https://n8n-supabase.tbjno4.easypanel.host'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.X_judqfP2Urk6dUESFo2bL2x2QaR4bLsvQ-4NGQYEv0';

// Esta variável _supabase será usada por todos os outros arquivos JS
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
