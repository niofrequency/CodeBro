const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' }); // Using your .env.local file

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

app.post('/api/grok', async (req, res) => {
  const { prompt, fileContext, mode } = req.body;

  // 1. Construct dynamic context so Grok sees your actual code
  let systemMessage = "You are Grok-3, a world-class software architect. ";
  
  if (fileContext) {
    systemMessage += `\n\nCURRENT FILE CONTEXT:\nPath: ${fileContext.path}\nContent:\n${fileContext.content}\n\n`;
    systemMessage += "Analyze this specific code and provide actionable, high-quality technical advice.";
  }

  // 2. Handle structured analysis for the "Analyze" tab
  if (mode === 'analyze') {
    systemMessage += "\nReturn ONLY a JSON object with: techStack (array), summary (string), issues (array), and plan (array). No extra text.";
  }

  try {
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: "grok-2-1212", // Update to "grok-3" when available in your API tier
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ content: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Bridge Error:', error.response?.data || error.message);
    res.status(500).json({ content: "Neural Link Error: Backend failed to communicate with Grok." });
  }
});

app.listen(PORT, () => console.log(`Grok Bridge running on http://localhost:${PORT}`));