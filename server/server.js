import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: "./server/.env" });

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Test backend
app.get("/", (req, res) => {
  res.json({
    message: "Family Health Hub AI server is running",
  });
});

// Test Groq AI
app.get("/api/ai/test", async (req, res) => {
  try {
    const response = await client.responses.create({
      model: "openai/gpt-oss-20b",
      input: "Say hello to Family Health Hub in one short sentence.",
    });

    res.json({
      success: true,
      response: response.output_text,
    });
  } catch (error) {
    console.error("Groq error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.post("/api/ai/report-summary", async (req, res) => {
  try {
    const { reportText } = req.body;

    if (!reportText || !reportText.trim()) {
      return res.status(400).json({
        error: "Report text is required.",
      });
    }

    const response = await client.responses.create({
      model: "openai/gpt-oss-20b",
      input: `
You are an AI assistant inside a family health management application.

Analyze the following medical report and explain it in simple language for a normal person.

IMPORTANT:
- Do not diagnose the patient.
- Do not prescribe medicines.
- Do not tell the patient to stop or start medication.
- Clearly identify values that appear outside the provided reference range.
- Explain what abnormal values may generally be associated with.
- Mention when the user should discuss something with their doctor.
- If the report does not provide a reference range, do not assume one.
- Be calm and easy to understand.
- Do not create information that is not present in the report.

Structure your response as:

1. Overall Summary
2. Normal Findings
3. Values That May Need Attention
4. What They Generally Mean
5. Questions to Discuss With Your Doctor

Medical Report:
${reportText}
      `,
    });

    res.json({
      success: true,
      summary: response.output_text,
    });
  } catch (error) {
    console.error("Groq report analysis error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze report.",
    });
  }
});
// -----------------------------
// AI Health Chatbot
// -----------------------------
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
      });
    }

    const response = await client.responses.create({
      model:"openai/gpt-oss-20b",
      input: `
You are the AI Health Assistant inside Family Health Hub.

Your job is to answer general health-related questions in a simple,
clear and responsible way.

IMPORTANT SAFETY RULES:
- Do not diagnose diseases.
- Do not prescribe medicines.
- Do not tell users to start, stop, or change medication.
- Do not replace a doctor or other qualified healthcare professional.
- Do not make up medical information.
- If the question requires professional medical evaluation, recommend
  discussing it with a healthcare professional.
- If the user describes a possible medical emergency, advise them to
  seek immediate emergency medical care.
- Keep answers understandable for a normal person.
- Do not unnecessarily frighten the user.
- Explain medical terms when useful.

User's question:
${message}
      `,
    });

    res.json({
      success: true,
      response: response.output_text,
    });
  } catch (error) {
    console.error("Groq chatbot error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to get AI response.",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`AI server running on http://localhost:${PORT}`);
});