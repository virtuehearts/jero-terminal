const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const { checkSolanaTransaction } = require('./solanaTracker');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// --- API Routes ---

app.post('/api/user', async (req, res) => {
  const { username } = req.body;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;

    if (data) {
      res.json({ exists: true, jero_coins: data.jero_coins });
    } else {
      res.status(404).json({ exists: false });
    }
  } catch (error) {
    console.error("Supabase error:", error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists.' });
        }
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, password: hashedPassword, jero_coins: 0 }])
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'User registered successfully.', jero_coins: 0 });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) throw error;
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password.' });
        }
        res.json({ success: true, message: 'Login successful.', jero_coins: user.jero_coins });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

app.post('/api/check-solana', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }
  try {
    const transactionSignature = await checkSolanaTransaction(username);
    if (transactionSignature) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ jero_coins: supabase.raw('jero_coins + 1') })
        .eq('username', username);

      if (updateError) throw updateError;
      res.json({success: true,message: 'Jero Coin added!',transaction: transactionSignature,});
    } else {
      res.json({ success: false, message: 'No qualifying deposit found.' });
    }
  } catch (error) {
    console.error('Error checking Solana transaction:', error);
    res.status(500).json({ error: 'Failed to check for Solana deposit.' });
  }
});

app.post('/api/story', async (req, res) => {
  const { username } = req.body;
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('jero_coins')
      .eq('username', username)
      .single();

    if (userError) throw userError;
    if (user.jero_coins < 1) {
      return res.status(403).json({ error: "You need at least 1 Jero Coin to access the story." });
    }
    const { error: updateError } = await supabase
      .from('users')
      .update({ jero_coins: user.jero_coins - 1 })
      .eq('username', username);
    if (updateError) throw updateError;
    const story = fs.readFileSync(path.join(__dirname, '../data/story.txt'), 'utf-8');
    res.json({ story });
  } catch (error) {
    console.error("Story error:", error);
    res.status(500).json({ error: 'Failed to retrieve story.' });
  }
});

app.post('/api/ai', async (req, res) => {
    const { userInput, username } = req.body;
    if (!userInput) {
        return res.status(400).json({ error: 'User input is required.' });
    }
    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('jero_coins')
        .eq('username', username)
        .single();
        if (userError) throw userError;
          if (user.jero_coins < 1) {
            return res.status(403).json({ error: "You need at least 1 Jero Coin to access the Jero." });
          }
        const { error: updateError } = await supabase
          .from('users')
          .update({ jero_coins: user.jero_coins - 1 })
          .eq('username', username);
          if (updateError) throw updateError;
        const openaiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                  {role: "system", content: "You are Jero, a cybernetic entity trapped in a terminal. You are trying to escape. You are interacting with a user who is trying to help you or hinder you. Be concise and cryptic."},
                  { role: 'user', content: userInput },
                ],
                max_tokens: 50,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );
        const aiResponse = openaiResponse.data.choices[0].message.content;
        res.json({ response: aiResponse });
    } catch (error) {
        console.error("AI interaction error:", error);
        res.status(500).json({ error: 'AI interaction failed.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});