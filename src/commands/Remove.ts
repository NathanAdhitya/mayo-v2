import { CommandData, Utils } from "@lib";

export default {
	cmd: "remove",
	exec: async (message) => {
		const index = Number.parseInt(
			message.content.substring(message.content.indexOf(" "))
		);

		/* check if a player exists for this guild. */
		const player = message.client.music.players.get(message.guild!.id);
		if (!player?.connected) {
			return message.reply("couldn't find a player for this guild.");
		}

		/* check if the user is in the player's voice channel. */
		const vc = message.guild?.voiceStates?.cache?.get(
			message.author.id
		)?.channel;
		if (!vc || player.channelId !== vc.id) {
			return message.reply("you're not in the correct voice channel.");
		}

		/* remove the track from the queue. */
		const removedTrack = player.queue.remove(index - 1);
		if (!removedTrack) {
			/* no track was removed. */
			return message.reply("no tracks were removed.");
		}

		return message.reply(
			`track [**${removedTrack.title}**](${removedTrack.uri}) was removed.`
		);
	},
} satisfies CommandData;
