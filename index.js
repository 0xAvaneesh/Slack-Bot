
require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

function getEmoji(weather) {
  weather = weather.toLowerCase();

  if (weather.includes("rain")) return "🌧️";
  if (weather.includes("cloud")) return "☁️";
  if (weather.includes("sun") || weather.includes("clear")) return "☀️";
  if (weather.includes("snow")) return "❄️";

  return "🌡️";
}

function makeMessage(data, city, unit) {
  const weather = data.current_condition[0];
  const area = data.nearest_area[0];

  let temp;
  let feels;
  let wind;
  let symbol;

  if (unit === "metric") {
    temp = weather.temp_C;
    feels = weather.FeelsLikeC;
    wind = weather.windspeedKmph + " km/h";
    symbol = "°C";
  } else {
    temp = weather.temp_F;
    feels = weather.FeelsLikeF;
    wind = weather.windspeedMiles + " mph";
    symbol = "°F";
  }

  const condition = weather.weatherDesc[0].value;

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${getEmoji(condition)} Weather in ${area.areaName[0].value}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*Condition:* ${condition}\n` +
          `*Temperature:* ${temp}${symbol}\n` +
          `*Feels like:* ${feels}${symbol}\n` +
          `*Humidity:* ${weather.humidity}%\n` +
          `*Wind:* ${wind}\n` +
          `*UV:* ${weather.uvIndex}`
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: unit === "metric" ? "Switch to °F" : "Switch to °C"
          },
          value: JSON.stringify({
            city: city,
            unit: unit === "metric" ? "imperial" : "metric"
          }),
          action_id: "toggle_units"
        }
      ]
    }
  ];
}

app.command("/weatherbuddy", async ({ command, ack, respond }) => {
  await ack();

  const city = command.text.trim();

  if (!city) {
    await respond({
      response_type: "ephemeral",
      text: "Please enter a city name. Example: /weatherbuddy Dubai"
    });
    return;
  }

  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const response = await axios.get(url);

    await respond({
      response_type: "in_channel",
      blocks: makeMessage(response.data, city, "metric"),
      text: `Weather in ${city}`
    });
  } catch (error) {
    await respond({
      response_type: "ephemeral",
      text: "Could not find that city."
    });
  }
});

app.action("toggle_units", async ({ ack, body, respond }) => {
  await ack();

  try {
    const info = JSON.parse(body.actions[0].value);

    const url =
      `https://wttr.in/${encodeURIComponent(info.city)}?format=j1`;

    const response = await axios.get(url);

    await respond({
      response_type: "in_channel",
      replace_original: true,
      blocks: makeMessage(response.data, info.city, info.unit)
    });
  } catch (error) {
    await respond({
      response_type: "ephemeral",
      text: "Error."
    });
  }
});

app.start(process.env.PORT || 3000);

