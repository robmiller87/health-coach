// LLM layer — one function, one place to swap providers.
// Currently Groq (OpenAI-compatible API). Returns null when no key is set
// or the call fails, so callers can fall back to deterministic phrasing.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function complete({ system, user }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        max_tokens: 300,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!res.ok) {
      console.error(`LLM: Groq returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('LLM: request failed', err.message);
    return null;
  }
}
