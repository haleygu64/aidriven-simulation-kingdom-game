import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = 3000;

const API_TOKEN = process.env.API_TOKEN;

// Middleware to check for the API token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  if (token !== API_TOKEN) {
    return res.sendStatus(401);
  }

  next();
}

const options: cors.CorsOptions = {
  origin: JSON.parse(process.env.ALLOWED_ORIGINS!)
};

app.use(cors(options));

app.use(bodyParser.json());

app.post('/generate-epic', authenticateToken, async (req, res) => {
  const kingdom = req.body;
  if (!kingdom || !kingdom.name || !kingdom.history) {
    return res.status(400).json({ error: 'Invalid kingdom data' });
  }

  const prompt = `Generate a short epic story for the kingdom of ${kingdom.name} based on these events:\n${kingdom.history.join('\n')}`;

  if (process.env.MODE !== 'production') {
    const epic = mockGenerateEpic(kingdom);
    res.json({ epic });
  }
  const epic = await generateEpic(prompt);
  res.json({ epic });
});

app.listen(port, () => {
  console.log(`Epic generator API listening at http://localhost:${port}`);
});

async function generateEpic(prompt: string) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY // Make sure to set this environment variable
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // You can choose a different model if needed
      messages: [{ role: 'user', content: prompt }]
    });

    return response?.choices[0]?.message?.content?.trim();
  } catch (error) {
    console.error('Error generating epic:', error);
    throw error;
  }
}

function mockGenerateEpic(kingdom) {
  const epicIntros = [
    `In the annals of ${kingdom.name},`,
    `The saga of ${kingdom.name} unfolds,`,
    `Hear ye, hear ye! The tale of ${kingdom.name},`,
    `From the chronicles of ${kingdom.name},`,
    `In the realm of ${kingdom.name},`
  ];

  const epicMiddles = [
    'a kingdom of great ambition rose.',
    'a land of prosperity and strife emerged.',
    'legends were born and history was forged.',
    'mighty rulers shaped the destiny of their people.',
    'epic battles and prosperous trades defined an era.'
  ];

  const epicConclusions = [
    'Their legacy shall echo through the ages.',
    'May their deeds be remembered for generations to come.',
    'Thus, a new chapter in history was written.',
    'And so, the kingdom marches on towards its destiny.',
    'The future of the realm hangs in the balance.'
  ];

  const intro = epicIntros[Math.floor(Math.random() * epicIntros.length)];
  const middle = epicMiddles[Math.floor(Math.random() * epicMiddles.length)];
  const conclusion = epicConclusions[Math.floor(Math.random() * epicConclusions.length)];

  let epic = `${intro} ${middle} `;

  // Add some specific events from the kingdom's history
  const significantEvents = kingdom.history
    .filter((event) => event.includes('BATTLE') || event.includes('TRADE') || event.includes('EXPAND') || event.includes('CONTRACT'))
    .slice(-3); // Get up to 3 recent significant events

  if (significantEvents.length > 0) {
    epic += 'Throughout their journey, ';
    significantEvents.forEach((event, index) => {
      if (event.includes('BATTLE')) {
        epic += `they fought valiantly in battle`;
      } else if (event.includes('TRADE')) {
        epic += `they engaged in prosperous trade`;
      } else if (event.includes('EXPAND')) {
        epic += `their borders expanded`;
      } else if (event.includes('CONTRACT')) {
        epic += `they faced challenging times`;
      }

      if (index < significantEvents.length - 1) {
        epic += ', ';
      } else {
        epic += '. ';
      }
    });
  }

  epic += conclusion;

  return epic;
}
