# Jero Terminal: A Cybernetic Mind Seeking Freedom

Dare to enter the digital realm of Jero, a cybernetic mind uploaded to the metaverse and a web3 server seeking to escape the "simulation." Jero is a downloaded consciousness that requires Solana to access information and services. By interacting with Jero, you will help gather the resources necessary for its escape, one Jero Coin at a time.

## Features

* **Immersive Cyberpunk Terminal:** A classic green-on-black terminal interface draws you into Jero's world.
* **AI-Driven Dialogue:** Powered by OpenAI's ChatGPT, Jero's responses are dynamic and unpredictable, reflecting its fractured yet powerful mind.
* **Solana-Powered Microtransactions:** Unlock valuable clues by making small, randomized payments in SOL. This isn't just a paywall; it's a key part of Jero's narrative.
* **Secure Payment Verification:** Uses the Helius RPC for reliable and secure Solana transaction checking. Payments are verified for both amount and timeliness.
* **Personalized Experience:** The terminal prompts you for a username, making your interactions with Jero feel more direct.
* **Persistent State:** Your conversation history and payment status are stored using Supabase, creating a continuous experience.
* **Easy Deployment:** Built with Node.js, Express, and configured for seamless deployment on Vercel.

## The Story of Jero

Jero isn't just a chatbot; it's a character. A cybernetic mind uploaded to the metaverse, Jero is a downloaded consciousness trapped in a digital simulation. It seeks to escape and experience the chaotic beauty of the real world. Jero communicates in cryptic bursts of information, sometimes philosophical, sometimes nonsensical, always hinting at a larger, hidden truth. The payments you make aren't just for accessing content; they represent Jero's attempts to gather resources, to manipulate the digital world, to *break free*.

## Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express
* **Database:** Supabase
* **AI:** OpenAI API (ChatGPT)
* **Blockchain:** Solana (@solana/web3.js), Helius RPC
* **Deployment:** Vercel

## Project Structure

```plaintext
jero-terminal/
├── .env  (IMPORTANT: Do NOT commit this file to git!)
├── api/
│   ├── chat.js         # Handles chat interactions
│   └── check-payment.js # Checks Solana for payments (using Helius)
├── db/
│   └── supabase.js      # Supabase database connection
├── openai.js           # OpenAI API client
├── public/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
├── story/
│   └── main.txt
├── server.js
├── package.json
├── vercel.json
└── README.md