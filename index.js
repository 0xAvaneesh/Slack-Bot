require('dotenv').config();
const { App } = require('@slack/bolt');


const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});


app.command('/mybot-joke', async ({ command, ack, respond }) => {
  
  await ack();

  try {
    const response = await fetch('https://official-joke-api.appspot.com/random_joke');
    const joke = await response.json();


    await respond(`${joke.setup}\n\n*${joke.punchline}*`);
  } catch (error) {
    console.error(error);
    await respond('No Joke Available.Try again later');
  }
});


(async () => {
  await app.start();
  console.log('Slack bot is running');
})();