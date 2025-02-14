import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.static("public"));
app.use(express.json());

import chatHandler from "./api/chat.js";
import checkPaymentHandler from "./api/check-payment.js";

app.post("/api/chat", chatHandler);
app.post("/api/check-payment", checkPaymentHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));