import { CommandData, Utils } from "@lib";

export default {
	cmd: "ping",
	exec: async (message) => {
		message.reply(
			`pong! **heartbeat:** *${Math.round(message.client.ws.ping)}ms*`
		);
	},
} satisfies CommandData;
