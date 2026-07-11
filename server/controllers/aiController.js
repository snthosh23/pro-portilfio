const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIController {
  static async chat(req, res) {
    const { prompt, type, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key') {
      // Elegant Demo/Mock Fallback Mode if API Key is not set
      console.warn('Gemini API key is missing. Running AI chatbot in demo mode.');
      return res.status(200).json({
        response: getMockAIResponse(prompt, type, context),
        isDemo: true
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Construct rich prompt tuning based on task category
      const systemInstruction = getSystemPromptForType(type, context);
      const fullPrompt = `${systemInstruction}\n\nUser Request: ${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return res.status(200).json({
        response: text,
        isDemo: false
      });
    } catch (error) {
      console.error('Gemini AI call failed:', error);
      return res.status(500).json({
        error: 'AI assistant error. Please verify your Gemini API key.',
        details: error.message
      });
    }
  }
}

// Prompt injection system instructions based on context
function getSystemPromptForType(type, context) {
  let instructions = 'You are an elite enterprise portfolio AI assistant, working for a Senior UI/UX Designer and Full Stack Developer. ';
  
  switch (type) {
    case 'bio':
      instructions += 'Rewrite the user\'s professional biography. Make it sound extremely professional, engaging, innovative, and tailored for top tier companies and tech clients. Output in markdown.';
      break;
    case 'project-desc':
      instructions += `Generate a high-conversion, details-oriented description for a portfolio project. Highlight architectural choices, design aesthetics, stack integration, and quantifiable outcomes. Context of current project: ${JSON.stringify(context || {})}. Output in markdown.`;
      break;
    case 'blog':
      instructions += 'Write a comprehensive, engaging, and SEO-optimized technical blog post. Include headings, lists, code samples where appropriate, and a conclusion. Write in standard markdown.';
      break;
    case 'seo':
      instructions += 'Provide high-performance SEO Meta Titles (max 60 chars), Meta Descriptions (max 160 chars), a list of highly searched Keywords, and detailed image alt-text recommendations. Return as clean markdown.';
      break;
    case 'reply':
      instructions += `Draft a professional, courteous, and detailed email reply. Keep the tone premium and welcoming. Context of incoming email: ${JSON.stringify(context || {})}`;
      break;
    case 'grammar':
      instructions += 'Correct grammar, typos, and improve sentence flow and vocabulary while keeping the original intent. Highlight your edits in a "Changes Made" section.';
      break;
    case 'suggestions':
      instructions += 'Review the developer\'s portfolio details and offer high-end UI/UX designs, new features, and layout upgrades to make it look world-class. Output in markdown.';
      break;
    default:
      instructions += 'Help the admin draft professional portfolio content, write articles, or reply to messages. Output beautiful, structured markdown.';
  }

  return instructions;
}

// High-fidelity fallback replies for testing before API key is plugged in
function getMockAIResponse(prompt, type, context) {
  const query = prompt.toLowerCase();
  
  if (type === 'seo' || query.includes('seo') || query.includes('meta')) {
    return `### 🔍 AI-Generated SEO Optimizations (Demo Mode)

Here are high-converting SEO meta elements generated for your request:

*   **Meta Title**: \`Santhosh Kumar | Premium Portfolio & Full-Stack Architect\`
*   **Meta Description**: \`Explore premium web applications, bespoke UI/UX designs, and advanced MVC systems built by Santhosh Kumar, full-stack engineer and designer.\`
*   **Keywords**: \`Full Stack Developer, UI/UX Designer, Node.js Expert, Firebase Portfolio, Custom Web Design, GSAP Animations, Web Security Engineer\`
*   **Image Alt Text**: \`Santhosh Kumar professional portfolio banner showing advanced dashboard, interactive projects and glassmorphic user interfaces.\`

---
> 💡 *To activate live Gemini generation, update the \`GEMINI_API_KEY\` variable in your backend \`server/.env\` file.*`;
  }

  if (type === 'project-desc' || query.includes('project') || query.includes('description')) {
    return `### 🚀 Enterprise Project Description: *${context?.title || 'Bespoke E-Commerce App'}* (Demo Mode)

**Overview**
A premium, highly secure e-commerce application designed with a dark glassmorphic interface, real-time inventory synchronization, and custom checkout animations.

**Key Architectural Features**
*   **Performance Optimization**: Implemented image lazy-loading and compressed static asset pipelines, resulting in a **99+ Lighthouse performance score**.
*   **Seamless Interaction**: Leveraged GSAP (GreenSock Animation Platform) for high-framerate scroll reveals, magnet buttons, and micro-interactions.
*   **Robust Security**: Standardized Express middlewares using Helmet, rate limiters, input validation, and XSS sanitization templates.
*   **Real-time synchronization**: Integrated Cloud Firestore listeners for instant inventory stock alerts.

**Stack Utilized**
*   *Frontend*: HTML5, Vanilla CSS3 (Custom design system), Vanilla JavaScript (ES6)
*   *Backend*: Node.js, Express.js
*   *Database & Auth*: Cloud Firestore, Firebase Auth, JWT Bearer Token

---
> 💡 *To activate live Gemini generation, update the \`GEMINI_API_KEY\` variable in your backend \`server/.env\` file.*`;
  }

  if (type === 'reply' || query.includes('reply') || query.includes('message')) {
    return `### ✉️ Draft Email Response (Demo Mode)

Dear ${context?.name || 'Valued Client'},

Thank you for reaching out to me through my portfolio contact portal. I am thrilled to hear about your upcoming project requirements!

Regarding your message: *"${context?.message || 'I would like to build a custom application with you'}"*

I would love to schedule a brief 15-minute discovery call to dive into the technical details, timelines, and design aesthetics you have in mind. Please let me know your availability this week, or feel free to schedule a time directly via my calendar.

Looking forward to collaborating with you!

Best regards,
**Santhosh Kumar**
*Senior UI/UX Designer & Software Architect*

---
> 💡 *To activate live Gemini generation, update the \`GEMINI_API_KEY\` variable in your backend \`server/.env\` file.*`;
  }

  // General chat default fallback
  return `### 🤖 Hello from your AI Portfolio Assistant! (Demo Mode)

I am here to help you compose premium descriptions, rewrite biographies, draft articles, optimize SEO tags, and proofread content.

*Currently, I am running in **Demo Mode** because no \`GEMINI_API_KEY\` was found in \`server/.env\`.*

**What would you like me to generate?**
1.  **Draft a blog post** on *"The Power of Vanilla JavaScript in Modern Web Design"*
2.  **Generate a project description** for a custom Dashboard
3.  **Optimize SEO meta tags** for the landing page
4.  **Polish a biography** to sound more professional

*Type a message below or click one of the quick templates in the sidebar to start trying out the UI layout!*`;
}

module.exports = AIController;
