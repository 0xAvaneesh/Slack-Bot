
require("dotenv").config();

var App = require("@slack/bolt").App;
var axios = require("axios");

var app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

var weatherIcons = {
  sunny: "☀️",
  clear: "☀️",
  cloud: "☁️",
  rain: "🌧️",
  snow: "❄️"
};

function getWeatherIcon(weather) {
  weather = weather.toLowerCase();

  if (weather.includes("rain")) return weatherIcons.rain;
  if (weather.includes("snow")) return weatherIcons.snow;
  if (weather.includes("cloud")) return weatherIcons.cloud;
  if (weather.includes("sun") || weather.includes("clear")) {
    return weatherIcons.sunny;
  }

  return "";
}

function getWeather(city, unit) {
  var url = "https://wttr.in/" + encodeURIComponent(city) + "?format=j1";

  return axios.get(url).then(function(response) {
    var data = response.data;
    var weather = data.current_condition[0];
    var area = data.nearest_area[0];

    var temp;
    var feels;
    var wind;
    var symbol;

    if (unit == "metric") {
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

    var condition = weather.weatherDesc[0].value;
    var name = area.areaName[0].value;

    return {
      name: name,
      condition: condition,
      temp: temp,
      feels: feels,
      wind: wind,
      humidity: weather.humidity,
      uv: weather.uvIndex,
      icon: getWeatherIcon(condition),
      symbol: symbol
    };
  });
}

function makeBlocks(weather, city, unit) {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: weather.icon + " Weather in " + weather.name
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Condition:* " + weather.condition + "\n" +
          "*Temperature:* " + weather.temp + weather.symbol + "\n" +
          "*Feels like:* " + weather.feels + weather.symbol + "\n" +
          "*Humidity:* " + weather.humidity + "%\n" +
          "*Wind:* " + weather.wind + "\n" +
          "*UV Index:* " + weather.uv
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: unit == "metric" ? "Switch to °F" : "Switch to °C"
          },
          value: JSON.stringify({
            city: city,
            unit: unit == "metric" ? "imperial" : "metric"
          }),
          action_id: "toggle_units"
        }
      ]
    }
  ];
}

app.command("/weatherbuddy", function(data) {
  data.ack();

  var city = data.command.text.trim();

  if (!city) {
    return data.respond({
      response_type: "ephemeral",
      text: "Please enter a city name."
    });
  }

  getWeather(city, "metric")
    .then(function(weather) {
      data.respond({
        response_type: "in_channel",
        blocks: makeBlocks(weather, city, "metric")
      });
    })
    .catch(function() {
      data.respond({
        response_type: "ephemeral",
        text: "Could not find weather for " + city
      });
    });
});

app.action("toggle_units", function(data) {
  data.ack();

  var info = JSON.parse(data.body.actions[0].value);

  getWeather(info.city, info.unit)
    .then(function(weather) {
      data.respond({
        response_type: "in_channel",
        replace_original: true,
        blocks: makeBlocks(weather, info.city, info.unit)
      });
    })
    .catch(function() {
      data.respond({
        response_type: "ephemeral",
        text: "Could not change the temperature unit."
      });
    });
});

app.start(process.env.PORT || 3000);

console.log("WeatherBuddy is running!");
