import { CommandData, MessageChannel, Utils } from "@lib";

export default {
	cmd: "join",
	exec: async (message) => {
		/* check if the invoker is in a voice channel. */
		const vc = message.guild?.voiceStates?.cache?.get(
			message.author.id
		)?.channel;
		if (!vc) {
			return message.reply("you must be in a vc");
		}

		/* check if a player already exists for this guild. */
		const player = message.client.music.createPlayer(vc.guild.id);
		if (player.connected) {
			return message.reply("already connected to a vc.");
		}

		/* set the queue channel so that we can send track start embeds. */
		player.queue.channel = message.channel as MessageChannel;

		/* connect to the vc. */
		await player.connect(vc.id);

		return message.reply(`joined ${vc}`);
	},
} satisfies CommandData;
