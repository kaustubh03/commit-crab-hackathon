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

app.post('/data', async (c) => {
  try {
    const dataPath = path.join(__dirname, 'data.json');
    const newEntry = await c.req.json();
    
    // Read current data
    const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Generate new ID
    const maxId = currentData.length > 0 ? Math.max(...currentData.map(item => item.id)) : 0;
    newEntry.id = maxId + 1;
    
    // Add new entry
    currentData.push(newEntry);
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2));
    
    return c.json({ message: 'Entry added successfully', entry: newEntry }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to add entry' }, 500);
  }
});

const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server running on port ${port}`);