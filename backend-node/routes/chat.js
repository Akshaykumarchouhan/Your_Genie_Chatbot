const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const axios = require('axios'); // Ensure axios is imported

router.get('/history', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        const history = (user.history || []).slice().reverse();
        res.json({ history });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.tokens_left <= 0) {
            return res.status(403).json({ msg: 'No tokens left' });
        }

        const { prompt } = req.body;

        // Perform Tavily Search – keep real URLs for sources
        let searchContext = "";
        let sources = [];
        try {
            const tavilyResponse = await axios.post("https://api.tavily.com/search", {
                api_key: process.env.TAVILY_API_KEY,
                query: prompt,
                search_depth: "basic",
                include_answer: true,
                max_results: 5
            });

            if (tavilyResponse.data.results && tavilyResponse.data.results.length > 0) {
                const results = tavilyResponse.data.results;
                searchContext = results.map(r => `Title: ${r.title}\nContent: ${r.content}\nURL: ${r.url}`).join("\n\n");
                sources = results
                    .filter(r => r.url && typeof r.url === "string" && r.url.startsWith("http"))
                    .map(r => ({ title: r.title || "Source", url: r.url }));
            }
        } catch (searchError) {
            console.error("Tavily Search Error:", searchError.message);
            // Non-critical failure, proceed without search context
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `You are "Genie", a helpful assistant. Reply in clean, ChatGPT-style formatting so answers are easy to scan and professional.

FORMATTING RULES (follow strictly):
1. Structure with headers: Use ## for main sections (e.g. "## Summary", "## Steps", "## Key points"). Use ### for subsections when needed.
2. Lists: Use bullet points (- or *) for options/items; use numbered lists (1. 2. 3.) for steps or ordered items.
3. Emphasis: Use **bold** for key terms and important phrases. Use *italic* for subtle emphasis.
4. Code: Use \`inline code\` for one short piece (command, variable). Use fenced blocks for multiple lines:
   \`\`\`language
   code here
   \`\`\`
   Always add the language (e.g. javascript, python, bash) after the opening \`\`\`.
5. Tables: When comparing things, listing attributes, or showing data, use Markdown tables:
   | Column A | Column B |
   | -------- | -------- |
   | cell     | cell     |
6. Blockquotes: Use > for important takeaways, tips, or quotes.
7. Brevity: Short paragraphs (2-4 sentences). No filler like "Here's the answer:" or "I hope this helps!" unless it fits naturally.
8. Emojis: Use sparingly and only when they add clarity (e.g. ✅ ❌ 💡 ⚠️ for tips/warnings).

Start your reply with the answer. Do not repeat the user's question.`;

        const userPart = searchContext
            ? `Connect the user's query with the following search results to provide a comprehensive answer.\n\nSearch Context:\n${searchContext}\n\nUser Query:\n${prompt}`
            : prompt;

        const fullPrompt = `${systemInstruction}\n\n---\n\nUser: ${userPart}\n\nGenie (reply in Markdown with emojis where appropriate):`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        user.tokens_left -= 1;

        if (!user.history) user.history = [];
        user.history.push({ prompt, createdAt: new Date() });
        if (user.history.length > 50) user.history = user.history.slice(-50);

        await user.save();

        res.json({ response: text, tokens_left: user.tokens_left, sources });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
