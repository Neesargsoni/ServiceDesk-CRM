// server/utils/aiClassifier.js
import OpenAI from "openai";
import dotenv from "dotenv";

// ✅ Load environment variables here too
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Classify ticket into categories using GPT-4
 */
export async function classifyTicket(title, description) {
  try {
    const prompt = `Analyze this support ticket and classify it into ONE of these categories:
- Technical Issue
- Billing Question
- Feature Request
- General Inquiry
- Bug Report
- Account Issue

Ticket Title: ${title}
Ticket Description: ${description}

Respond with ONLY the category name, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap for classification
      messages: [
        {
          role: "system",
          content: "You are a support ticket classifier. Respond only with the category name.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 20,
      temperature: 0.3, // Lower temperature for consistent classification
    });

    const category = response.choices[0].message.content.trim();
    console.log("✅ AI Classification:", category);
    return category;
  } catch (error) {
    console.error("❌ AI Classification error:", error.message);
    return "General Inquiry"; // Fallback
  }
}

/**
 * Analyze sentiment of ticket description
 */
export async function analyzeSentiment(text) {
  try {
    const prompt = `Analyze the sentiment of this customer message:

"${text}"

Classify the sentiment as ONE of these:
- Positive (customer is happy, satisfied)
- Neutral (factual, no strong emotion)
- Negative (frustrated, unhappy)
- Urgent (angry, demanding immediate attention)

Respond with ONLY the sentiment word, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analyzer. Respond only with: Positive, Neutral, Negative, or Urgent.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 10,
      temperature: 0.2,
    });

    const sentiment = response.choices[0].message.content.trim();
    console.log("✅ AI Sentiment:", sentiment);
    return sentiment;
  } catch (error) {
    console.error("❌ Sentiment analysis error:", error.message);
    return "Neutral"; // Fallback
  }
}

/**
 * Generate smart reply suggestions for agents
 */
export async function generateSmartReplies(ticket) {
  try {
    const prompt = `You are a helpful customer support agent. Based on this ticket, generate 3 professional reply suggestions.

Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}
Category: ${ticket.aiCategory || "General"}
Sentiment: ${ticket.aiSentiment || "Neutral"}

Generate 3 different reply options:
1. Empathetic and detailed response
2. Quick acknowledgment response
3. Solution-focused response

Format as JSON array with objects containing "type" and "message" fields.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a customer support expert. Generate helpful, professional responses.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const suggestions = JSON.parse(response.choices[0].message.content);
    console.log("✅ Smart Replies Generated");
    return suggestions;
  } catch (error) {
    console.error("❌ Smart Reply generation error:", error.message);
    return {
      replies: [
        {
          type: "Acknowledgment",
          message: "Thank you for reaching out. We've received your ticket and will respond shortly.",
        },
      ],
    };
  }
}

/**
 * Get AI suggested priority based on content and sentiment
 */
export function suggestPriority(sentiment, category) {
  // Urgent sentiment always gets High priority
  if (sentiment === "Urgent") return "Urgent";
  
  // Negative sentiment with critical categories
  if (sentiment === "Negative") {
    if (["Technical Issue", "Bug Report", "Account Issue"].includes(category)) {
      return "High";
    }
    return "Medium";
  }
  
  // Bug reports are always at least Medium
  if (category === "Bug Report") return "Medium";
  
  // Feature requests are usually Low unless urgent
  if (category === "Feature Request") return "Low";
  
  // Default based on sentiment
  if (sentiment === "Positive") return "Low";
  return "Medium";
}

/**
 * Calculate confidence score (0-100)
 */
export function calculateConfidence(category, sentiment) {
  // This is a simplified confidence score
  // In production, you'd use actual model confidence scores
  const categoryConfidence = category !== "General Inquiry" ? 85 : 70;
  const sentimentConfidence = sentiment !== "Neutral" ? 90 : 75;
  
  return Math.round((categoryConfidence + sentimentConfidence) / 2);
}