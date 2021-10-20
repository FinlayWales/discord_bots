const fs = require('fs');
const Discord = require('discord.js');
const axios = require('axios');

var live_check = false;
var streamer = "Enter Name Here";

var discordtoken = fs.readFileSync('EnderBot/token.txt', 'utf8');
const client = new Discord.Client();
client.login(discordtoken);

var twitchtoken = fs.readFileSync('EnderBot/twitchsecret.txt', 'utf8');
var accesstoken;

var loremessage;
var botchannelid = "Channel ID";

const helpEmbed = new Discord.MessageEmbed()
.setTitle('Commands')
.addFields(
	{ name: '>hi/>hello/>hey', value: 'Say hi! (Can be used to check if the bot is down/broken)' }
);

function checkstreams(client, accesstoken) {
	console.log("Checking... ")
	axios.get("https://api.twitch.tv/helix/search/channels?query=" + streamer + "&first=1", {
		headers: {
			'client-id': 'Client ID',
			'Authorization': 'Bearer ' + accesstoken
		}
	}).then(function (res) {
		if (res.data.data[0].is_live == true && live_check == false) {
			// went live
			live_check = true;
			client.channels.cache.get(botchannelid).send(":red_circle: " + streamer + " is Live: **" + res.data.data[0].title + "** at <https://www.twitch.tv/" + streamer + ">");
			// check lore
			checklore(client, res.data.data[0].title);
		} else if (res.data.data[0].is_live == false && live_check == true) {
			// no longer live
			live_check = false;
		}
	});
	console.log("Done!");
	console.log("");
}

client.on('ready', () => {
	client.user.setPresence({ activity: { name: '>help' }, status: 'online' });
	client.channels.cache.get(botchannelid).messages.fetch();
	axios.post("https://id.twitch.tv/oauth2/token?client_id=[Client ID]&client_secret=" + twitchtoken + "&grant_type=client_credentials").then((res) => {
		accesstoken = res.data.access_token;
	}).then(function () {
		setInterval(function(){checkstreams(client, accesstoken)}, 30000);
	});
	console.log('Ready');
});

client.on('message', message => {
	if (message.channel.type != "dm" && message.content.toLowerCase() == ">help") {
		message.channel.send(helpEmbed);
	}
	if (message.channel.type != "dm" && (message.content.toLowerCase() == ">hi" || message.content.toLowerCase() == ">hello" || message.content.toLowerCase() == ">hey")) {
		message.channel.send('hi');
	}
	if (message.content.toLowerCase().startsWith(">query")) {
		if (message.content.toLowerCase().split(" ").length > 1) {
			querytype = message.content.toLowerCase().split(" ")[1]
		} else {
			querytype = "NoQuery"
		}
		if (querytype == "channel") {
			cchannel = message.channel;
			constructmessage = "Channel Name: " + cchannel.name;
			constructmessage += "\nChannel ID: " + cchannel.id;
			constructmessage += "\nCategory: " + cchannel.parent.name;
			constructmessage += "\nCategory ID: " + cchannel.parent.id;
			constructmessage += "\nCreated On: " + cchannel.createdAt;
			constructmessage += "\nType: " + cchannel.type;
			message.channel.send(constructmessage);
		} else if (querytype == "server" || querytype == "guild") {
			if (message.guild.available) {
				message.guild.fetch().then(function(cguild) {
					constructmessage = "Guild Name: " + cguild.name;
					constructmessage += "\nGuildl ID: " + cguild.id;
					constructmessage += "\nCreated On: " + cguild.createdAt;
					constructmessage += "\nMember Count: " + cguild.memberCount;
					constructmessage += "\nDescription: " + cguild.description;
					constructmessage += "\nRegion: " + cguild.region;
					message.channel.send(constructmessage);
				});
			} else {
				message.channel.send("Unable to get Guild information")
			}
		} else if (querytype == "user") {
			var cuser;
			if (message.content.toLowerCase().split(" ").length > 2) {
				if (message.guild.available) {
					username = message.content.toLowerCase().split(" ")[2];
					usernumber = 0;
					if (message.content.toLowerCase().split(" ")[3]) {
						usernumber = message.content.toLowerCase().split(" ")[3] - 1;
					}
					getUserFromGuild(username, message.guild).then(function(userfromguild) {
						if (userfromguild.array().length <= 0) {
							message.channel.send("No users found. Check they are in the server, that you didn't include the tag in their username, and that didn't use their nickname.");
						} else if (userfromguild.array().length > 1) {
							message.channel.send("Multiple uusers found. Please rerun the command and specify which by appending the corresponding number to the end.\n");
							for (i=0;i<userfromguild.array().length;i++) {
								message.channel.send((i + 1) + ": " + userfromguild.array()[i].user.tag);
							}
						} else if (usernumber < 0) {
							message.channel.send("User index cannot be less than one.");
						} else if (usernumber + 1 > userfromguild.array().length) {
							message.channel.send("Could not get user index " + (usernumber + 1) + ". Only " + userfromguild.array().length + " users exist in this server matching that name.");
						} else {
							cuser = userfromguild.array()[usernumber].user;
							constructmessage = "Username: " + cuser.username;
							constructmessage += "\nTag: " + cuser.tag;
							constructmessage += "\nUser ID: " + cuser.id;
							constructmessage += "\nBot? " + cuser.bot;
							constructmessage += "\nAccount Created: " + cuser.createdAt;
							message.channel.send(constructmessage);
						}
					});
				} else {
					message.channel.send("This bot can only get user info from users in the same server. Please try this in a server instead or disclude the username to get info about yourself.")
				}
			} else {
				cuser = message.author
				constructmessage = "Username: " + cuser.username;
				constructmessage += "\nTag: " + cuser.tag;
				constructmessage += "\nUser ID: " + cuser.id;
				constructmessage += "\nBot? " + cuser.bot;
				constructmessage += "\nAccount Created: " + cuser.createdAt;
				message.channel.send(constructmessage);
			}
		} else if (querytype == "NoQuery") {
			message.channel.send("Please specify a query")
		} else {
			message.channel.send("Unrecognised Query")
		}
	}
});