document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("input");
    const output = document.getElementById("output");
    const terminal = document.getElementById("terminal");
    let username = prompt("Please enter your username:"); // Get username
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure username is not null or empty
    while (!username || username.trim() === "") {
        username = prompt("Username cannot be empty. Please enter your username:");
    }

    let paymentRequired = false;
    let lastPaymentCheck = 0;
    let promptSpan = document.querySelector(".input-line span");
    promptSpan.textContent = `${username}> `; // Update prompt
    let requiredAmount = null; // Store required amount

    input.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            const userMessage = input.value.trim();
            if (!userMessage) return;
            output.innerHTML += `\n${username}> ${userMessage}\n`; // Include username
            input.value = "";

            if (userMessage.toLowerCase() === "pay") {
                const now = Date.now();
                if (now - lastPaymentCheck > 5000) {
                    lastPaymentCheck = now;
                    checkPayment();
                } else {
                    typeMessage("Please wait a few seconds before checking again.", output, terminal);
                }
                return;
            }
            // Check if the message is a request for a clue
            const isClueRequest = userMessage.toLowerCase().includes("clue");

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage, userId, username, isClueRequest }) // Include username and clue request flag
            });

            const data = await response.json();
            if (data.paymentRequired) {
                paymentRequired = true;
                requiredAmount = data.requiredAmount; // Store the required amount
                typeMessage(`Jero: Payment of ${requiredAmount} SOL required for clues. Please send to ${process.env.WALLET_ADDRESS}. Type 'pay' to check for payment.`, output, terminal); //show response including required amount
            }else{
                typeMessage(`Jero: ${data.response}`, output, terminal);
            }
        }
    });

    async function checkPayment() {
        typeMessage("Checking for payment...", output, terminal);
        try {
            const response = await fetch("/api/check-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, username }), // Include username
            });
            const data = await response.json();

            if (data.paymentReceived) {
                paymentRequired = false;
                typeMessage(
                    `Jero: Payment received! Transaction: ${data.transactionSignature}. You can continue chatting now.`,
                    output,
                    terminal
                );
            } else {
                 if (requiredAmount !== null) {
                    typeMessage(`Jero: Payment not found. Please ensure you've sent ${requiredAmount} SOL.`, output, terminal);
                } else {
                    typeMessage("Jero: Payment not found. Please request a clue to get the payment amount.", output, terminal);
                }
            }
        } catch (error) {
            console.error("Error checking payment:", error);
            typeMessage("Jero: Error checking payment. Please try again later.", output, terminal);
        }
    }

    function typeMessage(text, outputElement, terminalElement) {
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                outputElement.innerHTML += text[index];
                index++;
                terminalElement.scrollTop = terminalElement.scrollHeight;
            } else {
                clearInterval(interval);
                outputElement.innerHTML += "\n";
            }
        }, 50);
    }
});