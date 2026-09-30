# Weather Bot

A simple Slack bot built for Hack Club Stardance that gives you live weather updates and forecasts for any location right inside Slack!

---

## What is this about?

This project started as a lightweight Slack bot to experiment with backend development, working with external APIs, and integrating services with Slack's Bolt SDK. Instead of leaving chat to check the weather, you can just run a quick slash command in any channel or DM to get live conditions anywhere in the world.

---

## How does it work?

To use the bot in Slack:
1. Open Slack and head over to any channel where the bot is added (or message it directly).
2. Type `/weather` followed by the city you want to check.

Example usage:
* `/weather London`
* `/weather Tokyo`
* `/weather Dubai`

---

## Setup & Running Locally (Optional)

If you want to host your own instance of Weather Bot:

1. Clone the repository:
   ```bash
   git clone [https://github.com/0xAvaneesh/Slack-Bot.git](https://github.com/0xAvaneesh/Slack-Bot.git)
   cd Slack-Bot
Install dependencies:

Bash
npm install
Set up your environment variables:
Create a .env file in the root directory:

Code snippet
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
WEATHER_API_KEY=your-weather-api-key
PORT=3000
Run the bot:

Bash
node index.js
What I learned from this project
Building Slack integrations using Node.js and the Slack Bolt framework.

Handling asynchronous HTTP requests and parsing weather data from external APIs.

Formatting clean user responses and handling slash command payloads seamlessly.

Creator
Made by @0xAvaneesh for the Hack Club Stardance challenge!
