import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: "./.env" });

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
// -----------------------------
// AI Health Overview
// -----------------------------
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

    const healthData = {
      member,
      medicalReports: Array.isArray(medicalReports)
        ? medicalReports
        : [],
      prescriptions: Array.isArray(prescriptions)
        ? prescriptions
        : [],
      healthRecords: Array.isArray(healthRecords)
        ? healthRecords
        : [],
    };

    const healthDataText = JSON.stringify(
      healthData,
      null,
      2
    );

    if (healthDataText.length > 50000) {
      return res.status(400).json({
        success: false,
        error: "Health data is too large to analyze.",
      });
    }

    const response = await client.responses.create({
      model: MODEL,
      input: `
You are the AI Health Summary assistant inside Family Health Hub.

Create a VERY SHORT dashboard summary for the selected family member.

Use ONLY the provided information.

SAFETY:
- Do not diagnose.
- Do not prescribe medicines.
- Do not invent information.
- Do not assume missing values.
- Do not say the person definitely has a disease.
- If something may need medical attention, say it should be discussed with a healthcare professional.
- Possible conditions must only be described as possibilities, never diagnoses.

IMPORTANT:
Return ONLY valid JSON.
No Markdown.
No headings.
No long paragraphs.
Do not include the family member ID.

Keep the response extremely concise.

Return exactly:

{
  "overall_status": "Good | Stable | Attention | Informational",
  "overall_summary": "One short sentence, maximum 18 words.",
  "key_stats": [
    {
      "label": "Blood type",
      "value": "..."
    },
    {
      "label": "Medications",
      "value": "..."
    },
    {
      "label": "Reports",
      "value": "..."
    }
  ],
  "attention_items": [
    "Short item, maximum 12 words."
  ],
  "positive_findings": [
    "Short positive finding, maximum 12 words."
  ]
}

STRICT LIMITS:
- Maximum 3 key_stats
- Maximum 2 attention_items
- Maximum 2 positive_findings
- overall_summary maximum 18 words
- Each list item maximum 12 words
- If nothing is available, use an empty array.
- Do not create unnecessary content.

Health Data:

${healthDataText}
      `,
    });

    let output = response.output_text?.trim();

    if (!output) {
      throw new Error("AI returned an empty response.");
    }

    output = output
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const summary = JSON.parse(output);

    res.json({
      success: true,
      member: member.name,
      summary,
    });

  } catch (error) {
    console.error("Groq health overview error:", error);

    res.status(500).json({
      success: false,
      error:
        "Unable to generate the health overview. Please try again.",
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