require("dotenv").config();

var { App } = require("@slack/bolt");
var axios = require("axios");

var app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

function getIcon(weather) {
  weather = weather.toLowerCase();

  if (weather.includes("rain")) return "🌧️";
  if (weather.includes("cloud")) return "☁️";
  if (weather.includes("sun") || weather.includes("clear")) return "☀️";
  if (weather.includes("snow")) return "❄️";

  return "🌡️";
}

async function getWeather(city, unit) {
  var url = "https://wttr.in/" + encodeURIComponent(city) + "?format=j1";
  var response = await axios.get(url);

  var current = response.data.current_condition[0];
  var area = response.data.nearest_area[0];

  var temp;
  var feels;
  var wind;
  var symbol;

  if (unit == "C") {
    temp = current.temp_C;
    feels = current.FeelsLikeC;
    wind = current.windspeedKmph + " km/h";
    symbol = "°C";
  } else {
    temp = current.temp_F;
    feels = current.FeelsLikeF;
    wind = current.windspeedMiles + " mph";
    symbol = "°F";
  }

  return {
    name: area.areaName[0].value,
    weather: current.weatherDesc[0].value,
    temp: temp,
    feels: feels,
    wind: wind,
    humidity: current.humidity,
    uv: current.uvIndex,
    icon: getIcon(current.weatherDesc[0].value),
    symbol: symbol
  };
}

function makeBlocks(w, city, unit) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          w.icon + " *Weather in " + w.name + "*\n\n" +
          "*Condition:* " + w.weather + "\n" +
          "*Temperature:* " + w.temp + w.symbol + "\n" +
          "*Feels like:* " + w.feels + w.symbol + "\n" +
          "*Humidity:* " + w.humidity + "%\n" +
          "*Wind:* " + w.wind + "\n" +
          "*UV:* " + w.uv
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: unit == "C" ? "Switch to °F" : "Switch to °C"
          },
          value: JSON.stringify({
            city: city,
            unit: unit == "C" ? "F" : "C"
          }),
          action_id: "change_unit"
        }
      ]
    }
  ];
}

app.command("/weatherbuddy", async function({ command, ack, respond }) {
  await ack();

  var city = command.text.trim();

  if (!city) {
    await respond({
      response_type: "ephemeral",
      text: "Please enter a city name."
    });
    return;
  }

  try {
    var w = await getWeather(city, "C");

    await respond({
      response_type: "in_channel",
      blocks: makeBlocks(w, city, "C")
    });
  } catch (err) {
    await respond({
      response_type: "ephemeral",
      text: "Could not find weather for " + city
    });
  }
});

app.action("change_unit", async function({ ack, body, respond }) {
  await ack();

  var info = JSON.parse(body.actions[0].value);

  try {
    var w = await getWeather(info.city, info.unit);

    await respond({
      response_type: "in_channel",
      replace_original: true,
      blocks: makeBlocks(w, info.city, info.unit)
    });
  } catch (err) {
    await respond({
      response_type: "ephemeral",
      text: "Something went wrong."
    });
  }
});

app.start(process.env.PORT || 3000);

console.log("WeatherBuddy is running!");
