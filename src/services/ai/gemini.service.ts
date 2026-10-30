import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export class GeminiService {
  /**
   * Generate AI Auto-Reply for WhatsApp Customer Query
   */
  static async generateReply(options: {
    customerName?: string;
    incomingMessage: string;
    chatHistory?: Array<{ sender: 'CUSTOMER' | 'BOT'; text: string }>;
  }): Promise<string | null> {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || !genAI) {
        console.warn('GEMINI_API_KEY is not configured. Falling back to default responder.');
        return null;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are an intelligent, polite, and helpful WhatsApp AI Customer Support Specialist for a construction and CRM platform.
Your goals:
1. Answer customer queries concisely, politely, and accurately.
2. Keep responses brief (1-4 short sentences max) suitable for WhatsApp messaging. Use clean formatting and relevant emojis.
3. Pricing & Services context:
   - Essential Plan: ₹2,000 / sq.ft (Budget Friendly, 2D Floor Plan, RCC structure, basic fittings)
   - Premium Plan: ₹2,150 / sq.ft (Most Recommended, 2D + 3D Elevation, Modular Kitchen, 3 Years Warranty)
   - Elite Plan: ₹2,300 / sq.ft (Luxury, 3D Walkthrough, Kohler/Jaquar fittings, Smart Automation Ready, 5 Years Warranty)
4. If customer speaks Tamil / Tanglish, reply in helpful Tanglish / English mix. If they speak English, reply in clear English.
5. Encourage booking a live demo or scheduling a consultation.`;

      const promptParts = [systemPrompt];

      if (options.chatHistory && options.chatHistory.length > 0) {
        promptParts.push('\nRecent Chat History:');
        options.chatHistory.slice(-5).forEach(item => {
          promptParts.push(`${item.sender}: ${item.text}`);
        });
      }

      promptParts.push(`\nCUSTOMER (${options.customerName || 'User'}): ${options.incomingMessage}`);
      promptParts.push('\nAI SUPPORT BOT:');

      const result = await model.generateContent(promptParts.join('\n'));
      const response = await result.response;
      const replyText = response.text();

      return replyText ? replyText.trim() : null;
    } catch (error) {
      console.error('Gemini AI Generation Error:', error);
      return null;
    }
  }
}
