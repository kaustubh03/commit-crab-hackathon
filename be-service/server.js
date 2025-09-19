const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const fs = require('fs');
const path = require('path');

const app = new Hono();

app.get('/data', (c) => {
  try {
    const dataPath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to read data' }, 500);
  }
});

const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server running on port ${port}`);