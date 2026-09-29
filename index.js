const { App } = require('@slack/bolt');
const axios = require('axios');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.command('/weather', async ({ command, ack, respond }) => {
  await ack();

  const locationQuery = command.text.trim();

  if (!locationQuery) {
    await respond('Please specify a location. Example: `/weather Tokyo`');
    return;
  }

  try {
    const geoRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=1`
    );

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      await respond(`Location "${locationQuery}" not found.`);
      return;
    }

    const { latitude, longitude, name, country } = geoRes.data.results[0];

    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const { temperature, windspeed } = weatherRes.data.current_weather;

    await respond(
      `🌤️ *Current Weather in ${name}, ${country}*:\n• *Temperature:* ${temperature}°C\n• *Wind Speed:* ${windspeed} km/h`
    );
  } catch (error) {
    console.error('Error fetching weather:', error);
    await respond('Error.');
  }
});

(async () => {
  await app.start();
  console.log('Slack weather bot is running!');
})();
