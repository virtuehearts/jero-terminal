import { getUserHistory, saveInteraction, getLastPaymentStatus, getPaymentDetails } from "../db/supabase.js";
import openai from "../openai.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storyText = fs.readFileSync(path.join(__dirname, "../story/main.txt"), "utf-8");

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { message, userId, username, isClueRequest } = req.body;

    if (isClueRequest) {
        const paymentStatus = await getLastPaymentStatus(userId);
        if (!paymentStatus) {

            // Generate random amount: 0.02 to 0.02999999
            const minAmount = 0.02;
            const maxAmount = 0.02999999;
            const requiredAmount = +(Math.random() * (maxAmount - minAmount) + minAmount).toFixed(8);
            const requestTimestamp = new Date().toISOString(); // Current time

            // Save the request details
            await saveInteraction(userId, username, message, "Payment request initiated.", false, requiredAmount, requestTimestamp);

            return res.json({
                response: `Payment of ${requiredAmount} SOL required for clues. Please send to ${process.env.WALLET_ADDRESS}. Type 'pay' to check for payment.`,
                paymentRequired: true,
                requiredAmount: requiredAmount, // Send amount to frontend
            });
        }
    }

    // If not a clue request, OR if payment is made, proceed
    const history = await getUserHistory(userId);
    const formattedHistory = history.flatMap(h => [
        { role: "user", content: h.message },
        { role: "assistant", content: h.response }
    ]);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: storyText },
                ...formattedHistory,
                { role: "user", content: message }
            ],
        });

        const botReply = response.choices[0].message.content;
        await saveInteraction(userId, username, message, botReply);
        res.json({ response: botReply });

    } catch (error) {
        console.error("OpenAI error:", error);
        return res.status(500).json({ error: 'Error with OpenAI API' });
    }
}