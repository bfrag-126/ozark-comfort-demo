// Vercel serverless function: POST /api/agent
// Holds the real Anthropic API key server-side (set as the ANTHROPIC_API_KEY
// environment variable in the Vercel project) so it's never exposed to the
// browser. The front-end sends a single "prompt" string already containing
// all the grounding context it needs; this function just forwards it to
// Claude and returns the plain text response.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'The site is not yet configured with an Anthropic API key (ANTHROPIC_API_KEY is missing in Vercel project settings).',
    });
    return;
  }

  // Some API keys are tied to a specific Console workspace (an "identity-linked"
  // key) rather than being workspace-agnostic. When that's the case, Anthropic
  // requires the request to say which workspace it's acting in via this header.
  // Set ANTHROPIC_WORKSPACE_ID in Vercel only if your key needs it -- a plain
  // org-wide key works fine without it, and this header is simply omitted then.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing "prompt" in request body.' });
    return;
  }

  try {
    const headers = {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    if (workspaceId) {
      headers['anthropic-workspace-id'] = workspaceId;
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const message = (data && data.error && data.error.message) || `Anthropic API error (${upstream.status})`;
      res.status(upstream.status).json({ error: message });
      return;
    }

    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Unexpected error calling the assistant.' });
  }
};
