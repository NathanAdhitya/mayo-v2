import "dotenv/config";
import "module-alias/register";
import { load } from "@lavaclient/spotify";
import { Bot, CommandData, Utils } from "@lib";
import { join } from "path";
import { ActivityType } from "discord.js";
import { Player } from "lavaclient";

load({
	client: {
		id: process.env.SPOTIFY_CLIENT_ID!,
		secret: process.env.SPOTIFY_CLIENT_SECRET!,
	},
	autoResolveYoutubeTracks: true,
});

const client = new Bot();
let commandMap: Map<string, CommandData["exec"]> = new Map();
const guildPlayerTimeouts = new Map<string, NodeJS.Timeout>();
const playerIdleTimeoutMs = 5 * 60 * 1000;

client.music.on("connect", () => {
	console.log(`[music] now connected to lavalink`);
});

client.music.on("queueFinish", (queue) => {
	queue.channel.send("uh oh, the queue has ended :/");

	// Set a timeout of 5 minutes before disconnecting
	guildPlayerTimeouts.set(
		queue.player.guildId,
		setTimeout(() => {
			try {
				queue.player.disconnect();
				queue.player.node.destroyPlayer(queue.player.guildId);
			} catch (e) {}
		}, playerIdleTimeoutMs)
	);
});

client.music.on("trackStart", (queue, song) => {
	try {
		// Cancel timeout if it exists
		const timeout = guildPlayerTimeouts.get(queue.player.guildId);
		if (timeout !== undefined) {
			clearTimeout(timeout);
			guildPlayerTimeouts.delete(queue.player.guildId);
		}

		queue.channel.send({
			content: `now playing [**${song.title}**](${song.uri}) ${
				song.requester ? `requested by <@${song.requester}>` : ""
			}`,
			allowedMentions: { parse: [] },
		});
	} catch (e) {
		console.error(e);
	}
});

client.on("ready", async () => {
	commandMap = await Utils.prepareCommands(join(__dirname, "commands"));
	client.music.connect(client.user!.id); // Client#user shouldn't be null on ready
	client.user!.setActivity(`music. ${process.env.BOT_PREFIX}mayohelp`);
	console.log("[discord] ready!");
});

client.on("messageCreate", (message) => {
	if (!message.content.startsWith(process.env.BOT_PREFIX!)) return;
	if (message.author.bot) return;

	const cmdName = message.content.split(" ")[0].substring(1).toLowerCase();
	const cmdData = commandMap.get(cmdName);
	if (cmdData !== undefined) {
		try {
			cmdData(message);
		} catch (e) {
			message.channel.send(
				Utils.embed(
					`an error occurred while executing the command: \`${e}\``
				)
			);
		}
	}
});

client.login(process.env.BOT_TOKEN);
