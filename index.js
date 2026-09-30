require('dotenv').config();
const { App } = require('@slack/bolt');
const axios = require('axios');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

function getWeatherEmoji(condition) {
  const text = condition.toLowerCase();
  if (text.includes('sun') || text.includes('clear')) return '☀️';
  if (text.includes('cloud') || text.includes('overcast')) return '☁️';
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) return '🌧️️';
  if (text.includes('thunder')) return '🌩️';
  if (text.includes('snow') || text.includes('ice') || text.includes('sleet')) return '❄️';
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) return '🌫️';
  return '🌡️';
}

function buildWeatherBlocks(city, currentCondition, nearestArea, unit = 'metric') {
  const isMetric = unit === 'metric';
  const temp = parseInt(isMetric ? currentCondition.temp_C : currentCondition.temp_F);
  const feelsLike = parseInt(isMetric ? currentCondition.FeelsLikeC : currentCondition.FeelsLikeF);
  const humidity = currentCondition.humidity;
  const windSpeed = isMetric ? `${currentCondition.windspeedKmph} km/h` : `${currentCondition.windspeedMiles} mph`;
  const conditionText = currentCondition.weatherDesc[0].value;
  const locationName = nearestArea.areaName[0].value;
  const country = nearestArea.country[0].value;

  const unitSymbol = isMetric ? '°C' : '°F';
  const emoji = getWeatherEmoji(conditionText);

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} Weather in ${locationName}, ${country}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Condition:* ${conditionText}\n*Temperature:* *${temp}${unitSymbol}* (Feels like ${feelsLike}${unitSymbol})`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Humidity:*\n${humidity}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Wind Speed:*\n${windSpeed}`,
        },
        {
          type: 'mrkdwn',
          text: `*UV Index:*\n${currentCondition.uvIndex}`,
        },
        {
          type: 'mrkdwn',
          text: `*Visibility:*\n${currentCondition.visibility} km`,
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: isMetric ? 'Switch to °F' : 'Switch to °C',
            emoji: true,
          },
          value: JSON.stringify({ city, unit: isMetric ? 'imperial' : 'metric' }),
          action_id: 'toggle_units',
        },
      ],
    },
  ];
}

app.command('/weatherbuddy', async ({ command, ack, respond }) => {
  await ack();

  const city = command.text.trim();

  if (!city) {
    await respond({
      response_type: 'ephemeral',
      text: 'Please provide a city name! Example: `/weatherbuddy Dubai` or `/weatherbuddy Tokyo`',
    });
    return;
  }

  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const response = await axios.get(url);

    const currentCondition = response.data.current_condition[0];
    const nearestArea = response.data.nearest_area[0];
    const blocks = buildWeatherBlocks(city, currentCondition, nearestArea, 'metric');

    await respond({
      response_type: 'in_channel',
      blocks: blocks,
      text: `Weather update for ${city}`,
    });
  } catch (error) {
    await respond({
      response_type: 'ephemeral',
      text: `Could not find weather data for *"${city}"*. Please check the spelling and try again.`,
    });
  }
});

app.action('toggle_units', async ({ ack, body, respond }) => {
  await ack();

  try {
    const { city, unit } = JSON.parse(body.actions[0].value);

    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const response = await axios.get(url);

    const currentCondition = response.data.current_condition[0];
    const nearestArea = response.data.nearest_area[0];
    const updatedBlocks = buildWeatherBlocks(city, currentCondition, nearestArea, unit);

    await respond({
      response_type: 'in_channel',
      replace_original: true,
      blocks: updatedBlocks,
      text: `Updated weather for ${city}`,
    });
  } catch (error) {
    await respond({
      response_type: 'ephemeral',
      text: 'Failed to switch temperature units. Please try running the command again.',
    });
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡ Weather Bot is running on port ${port}!`);
})();
