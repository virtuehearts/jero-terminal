const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_WALLET = process.env.SOLANA_WALLET;
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

async function checkSolanaTransaction(username) {
    if (!HELIUS_API_KEY) {
        throw new Error("Helius API key is not set. Check your .env file.");
    }
    try {
        const response = await axios.post(HELIUS_RPC_URL, {
            jsonrpc: '2.0',
            id: 'my-transaction-checker',
            method: 'getConfirmedSignaturesForAddress2',
            params: [
                SOLANA_WALLET,
                { limit: 10 }
            ]
        });
        if (response.data.error) {
            throw new Error(`Helius API Error: ${response.data.error.message}`);
        }
        const signatures = response.data.result;
        if (!signatures || signatures.length === 0) {
            return null;
        }
        for (const signatureInfo of signatures) {
            const txResponse = await axios.post(HELIUS_RPC_URL, {
                jsonrpc: '2.0',
                id: signatureInfo.signature,
                method: 'getTransaction',
                params: [