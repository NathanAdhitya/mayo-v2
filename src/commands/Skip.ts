import { CommandData, Utils } from "@lib";

export default {
	cmd: "skip",
	exec: async (message) => {
		/* check if a player exists for this guild. */
		const player = message.client.music.players.get(message.guild!.id);
		if (!player?.connected) {
			return message.reply("couldn't find a player for this guild.");
		}

		/* check if the invoker is in a vc. */
		const vc = message.guild?.voiceStates?.cache?.get(
			message.author.id
		)?.channel;
		if (!vc) {
			return message.reply("join a voice channel first.");
		}

		/* check if a player already exists, if so check if the invoker is in our vc. */
		if (player && player.channelId !== vc.id) {
			return message.reply(
				`player already exists in <#${player.channelId}> :(`
			);
		}

		if (!player.trackData) return message.reply("not playing any music?");

		const currentPlaying = player.trackData?.title;

		/* skip and go to next. */
		await player.stop();
		await player.queue.start();

		await message.reply(`skipping ${currentPlaying}`);
	},
} satisfies CommandData;
