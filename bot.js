const Discord = require("discord.js");
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logeado como ${client.user.tag}`);
});

client.login()