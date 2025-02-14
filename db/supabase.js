import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserHistory(userId) {
    const { data, error } = await supabase
        .from("interactions")
        .select("message, response, payment_status")
        .eq("user_id", userId)
        .order("timestamp", { ascending: true });
    if (error) {
        console.error("Error getting user history:", error);
        return []; // Return empty array on error
    }

    return data || [];
}

export async function saveInteraction(userId, userName, message, response, paymentStatus = false, requestedAmount = null, requestTimestamp = null) {
    const { error } = await supabase.from("interactions").insert([
        {
            user_id: userId,
            user_name: userName,
            message,
            response,
            payment_status: paymentStatus,
            requested_amount: requestedAmount,      // Store amount
            request_timestamp: requestTimestamp, // Store timestamp
        }
    ]);
    if (error) {
        console.error("Error saving interaction:", error);
    }
}
export async function updatePaymentStatus(userId, status, transactionSignature, senderWallet) {

    // Find the interaction by user_name and update it
    const { data: userInteractions, error: userError } = await supabase
        .from('interactions')
        .select('id, user_id')
        .eq('user_id', userId)

    if (userError) {
        console.error("Error getting user ID:", userError);
        throw userError;
    }

    if (userInteractions && userInteractions.length > 0) {
        // Update all matching interactions with the correct userId
        const { error: updateError } = await supabase
            .from('interactions')
            .update({ payment_status: status, transaction_signature: transactionSignature, sender_wallet: senderWallet, user_id: userId})
            .eq('user_id', userId);

        if (updateError) {
            console.error("Error updating payment status:", updateError);
            throw updateError;
        }
    }
}

export async function getLastPaymentStatus(userId) {
    const { data, error } = await supabase
        .from('interactions')
        .select('payment_status')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error getting payment status:", error);
        return null;
    }
    return data && data.length > 0 ? data[0].payment_status : false;
}

// NEW FUNCTION: Get the requested amount and timestamp
export async function getPaymentDetails(userId) {
    const { data, error } = await supabase
        .from('interactions')
        .select('requested_amount, request_timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error getting payment details:", error);
        return null;
    }

    return data && data.length > 0 ? data[0] : null;
}