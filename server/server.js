import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: "./server/.env" });

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "openai/gpt-oss-20b";

// -----------------------------
// Test backend
// -----------------------------
app.get("/", (req, res) => {
  res.json({
    message: "Family Health Hub AI server is running",
  });
});

// -----------------------------
// Test Groq AI
// -----------------------------
app.get("/api/ai/test", async (req, res) => {
  try {
    const response = await client.responses.create({
      model: MODEL,
      input: "Say hello to Family Health Hub in one short sentence.",
    });

    res.json({
      success: true,
      response: response.output_text,
    });
  } catch (error) {
    console.error("Groq test error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to connect to the AI service.",
    });
  }
});

// -----------------------------
// AI Report Summary
// -----------------------------
app.post("/api/ai/report-summary", async (req, res) => {
  try {
    const { reportText } = req.body;

    if (!reportText || !reportText.trim()) {
      return res.status(400).json({
        success: false,
        error: "No medical report text was provided."
      });
    }

    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_completion_tokens: 4000,

      messages: [
        {
          role: "system",
          content: `
You are a medical report explanation assistant.

Explain medical reports to an ordinary person without medical knowledge.

The goal is NOT to repeat the laboratory table.
The report already contains the numbers.

Instead:
- explain the overall meaning
- identify the most important findings
- explain important medical terms simply
- explain general possible reasons for abnormal findings
- suggest what the person can discuss with a healthcare professional
- give a simple final takeaway

Never diagnose a disease.
Never prescribe medication.
Never tell the person to start, stop, or change medication.
Never invent values that are not present in the report.
If OCR information looks unreliable or unclear, say so.

Keep the answer concise and useful.
Only include the 3 most important findings.
Only explain up to 4 important medical terms.
Only mention general possible reasons for important abnormal findings.

IMPORTANT:
You MUST provide every field in the requested JSON schema.
Do not omit any field.
`
        },
        {
          role: "user",
          content: `
Analyze the following medical report.

MEDICAL REPORT:
${reportText}

Create a simple report summary for a normal person.

Focus on what the report means rather than repeating every number.

For normal results, briefly mention the reassuring overall picture.
For abnormal or borderline results, explain what they mean and why they may matter.

Possible reasons must be presented only as general possibilities, NOT as a diagnosis.
`
        }
      ],

      response_format: {
        type: "json_schema",
        json_schema: {
          name: "medical_report_summary",
          strict: true,

          schema: {
            type: "object",
            additionalProperties: false,

            properties: {

              overall_summary: {
                type: "string"
              },

              key_findings: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,

                  properties: {
                    title: {
                      type: "string"
                    },

                    explanation: {
                      type: "string"
                    }
                  },

                  required: [
                    "title",
                    "explanation"
                  ]
                }
              },

              medical_terms: {
                type: "array",
                maxItems: 4,
                items: {
                  type: "object",
                  additionalProperties: false,

                  properties: {
                    term: {
                      type: "string"
                    },

                    meaning: {
                      type: "string"
                    }
                  },

                  required: [
                    "term",
                    "meaning"
                  ]
                }
              },

              possible_explanations: {
                type: "string"
              },

              what_to_do_next: {
                type: "array",
                maxItems: 4,
                items: {
                  type: "string"
                }
              },

              simple_takeaway: {
                type: "string"
              }
            },

            required: [
              "overall_summary",
              "key_findings",
              "medical_terms",
              "possible_explanations",
              "what_to_do_next",
              "simple_takeaway"
            ]
          }
        }
      }
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    console.log("AI RAW RESPONSE:");
    console.log(content);

    const analysis = JSON.parse(content);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error("Groq report analysis error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Unable to generate medical report analysis."
    });
  }
});
//----------------------------
// AI Health Chatbot
// -----------------------------
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Message is too long.",
      });
    }

    const response = await client.responses.create({
      model: MODEL,
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
      error: "Unable to get an AI response. Please try again.",
    });
  }
});

// -----------------------------
// AI Health Overview
// -----------------------------
app.post("/api/ai/health-overview", async (req, res) => {
  try {
    const {
      member,
      medicalReports,
      prescriptions,
      healthRecords,
    } = req.body;

    if (!member || typeof member !== "object" || !member.name) {
      return res.status(400).json({
        success: false,
        error: "Selected family member is required.",
      });
    }

    if (
      medicalReports !== undefined &&
      !Array.isArray(medicalReports)
    ) {
      return res.status(400).json({
        success: false,
        error: "Medical reports must be an array.",
      });
    }

    if (
      prescriptions !== undefined &&
      !Array.isArray(prescriptions)
    ) {
      return res.status(400).json({
        success: false,
        error: "Prescriptions must be an array.",
      });
    }

    if (
      healthRecords !== undefined &&
      !Array.isArray(healthRecords)
    ) {
      return res.status(400).json({
        success: false,
        error: "Health records must be an array.",
      });
    }

    const healthData = {
      member,
      medicalReports: medicalReports || [],
      prescriptions: prescriptions || [],
      healthRecords: healthRecords || [],
    };

    const healthDataText = JSON.stringify(healthData, null, 2);

    if (healthDataText.length > 50000) {
      return res.status(400).json({
        success: false,
        error: "Health data is too large to analyze.",
      });
    }

    const response = await client.responses.create({
      model: MODEL,
      input: `
You are the AI Health Overview assistant inside Family Health Hub.

Create a simple health overview for ONE selected family member using
ONLY the information provided below.

IMPORTANT SAFETY RULES:
- Do not diagnose diseases or medical conditions.
- Do not prescribe medicines.
- Do not tell the user to start, stop, or change medication.
- Do not invent medical information.
- Do not assume missing values.
- If a medical report provides a reference range, use that range when
  discussing whether a value may be outside the range.
- If no reference range is provided, do not assume one.
- If information appears unclear or may contain an OCR error, say that
  it should be verified against the original report.
- Clearly distinguish documented information from general explanation.
- Recommend discussing concerning findings with a qualified healthcare
  professional.
- Keep the language simple, calm and understandable.

Create the overview using these sections:

1. Overall Health Status
2. Recent Health Observations
3. Things That May Need Attention
4. Stable / Positive Findings
5. Questions to Discuss With a Doctor

Selected Family Member's Health Data:
${healthDataText}
      `,
    });

    res.json({
      success: true,
      member: member.name,
      summary: response.output_text,
    });
  } catch (error) {
    console.error("Groq health overview error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to generate the health overview. Please try again.",
    });
  }
});

// -----------------------------
// Start server
// -----------------------------
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`AI server running on http://localhost:${PORT}`);
});