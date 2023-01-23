import { CommandData, MessageChannel, Utils } from "@lib";

export default {
	cmd: "mayohelp",
	exec: async (message) => {
		const prefix = process.env.BOT_PREFIX;
		const cmdHelps = [
			["help", "command info"],
			["join", "join your current vc"],
			["ping", "pong"],
			["play <search or url>", "play music"],
			["queue", "ooh what's playing?"],
			["remove <index>", "remove something in the queue"],
			["stop", "destroy the player for the guild"],
		];
		const msg =
			"**is mayonnaise an instrument?**\n" +
			"*no patrick, mayonnaise is not an instrument*\n" +
			"__a personal music bot by Nathan\n\n__" +
			cmdHelps.map((v) => `${prefix}${v[0]} - ${v[1]}`).join("\n");
		return message.reply(msg);
	},
} satisfies CommandData;
