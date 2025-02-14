import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { updatePaymentStatus, getPaymentDetails } from '../db/supabase.js'; // Import getPaymentDetails

const heliusRpcUrl = `${process.env.HELIUS_RPC_URL_BASE}?api-key=${process.env.HELIUS_API_KEY}`;
const connection = new Connection(heliusRpcUrl, 'confirmed');
const targetWallet = new PublicKey(process.env.WALLET_ADDRESS);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        // Get expected amount and request time
        const paymentDetails = await getPaymentDetails(userId);
        if (!paymentDetails) {
            return res.json({ paymentReceived: false, message: "No pending payment request found." });
        }

        const { requested_amount, request_timestamp } = paymentDetails;
        const requestTime = new Date(request_timestamp);

        const signatureList = await connection.getSignaturesForAddress(targetWallet, { limit: 10 });

        for (const signatureInfo of signatureList) {
            const transaction = await connection.getTransaction(signatureInfo.signature);
            if (!transaction) continue;

            for (const instruction of transaction.transaction.message.instructions) {
                const programId = transaction.transaction.message.accountKeys[instruction.programIdIndex];
                if (programId.toBase58() !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') continue;
                const decodedInstruction = instruction;

                if (decodedInstruction && decodedInstruction.data) {
                    const buffer = Buffer.from(decodedInstruction.data, 'base64');
                    const amount = buffer.readBigUInt64LE(1);
                    const source = transaction.transaction.message.accountKeys[decodedInstruction.accounts[0]].toBase58();
                    const destination = transaction.transaction.message.accountKeys[decodedInstruction.accounts[1]].toBase58();

                    // Check amount AND timestamp
                    const transactionTime = new Date(transaction.blockTime * 1000); // Convert to milliseconds
                    const timeDifference = Math.abs(transactionTime - requestTime);
                    const oneHourInMs = 60 * 60 * 1000;

                    if (
                        destination === process.env.WALLET_ADDRESS &&
                        Number(amount) === Number(requested_amount * LAMPORTS_PER_SOL) &&  // Exact amount match
                        timeDifference <= oneHourInMs
                    ) {
                        await updatePaymentStatus(userId, true, signatureInfo.signature, source);
                        return res.json({ paymentReceived: true, transactionSignature: signatureInfo.signature });
                    }
                }
            }
        }
        return res.json({ paymentReceived: false });
    } catch (error) {
        console.error('Error checking for payments:', error);
        return res.status(500).json({ error: 'Error checking for payments' });
    }
}