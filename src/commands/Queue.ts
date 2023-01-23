import { CommandData, Utils } from "@lib";

const formatIndex = (index: number, size: number) =>
	(index + 1).toString().padStart(size.toString().length, "0");

export default {
	cmd: "queue",
	exec: async (message) => {
		/* check if a player exists for this guild. */
		const player = message.client.music.players.get(message.guild!.id);
		if (!player?.connected) {
			return message.reply("couldn't find a player for this guild.");
		}

		const currentPlaying = player.trackData?.title;

		/* check if the queue is empty. */
		if (!player.queue.tracks.length) {
			return message.reply(
				`${
					currentPlaying
						? `currently playing: ${currentPlaying}\n`
						: ""
				}there are no tracks in the queue.`
			);
		}

		/* respond with an embed of the queue. */
		const size = player.queue.tracks.length;
		const str = player.queue.tracks
			.map(
				(t, idx) =>
					`\`#${formatIndex(idx, size)}\` [**${t.title}**](${
						t.uri
					}) ${t.requester ? `<@${t.requester}>` : ""}`
			)
			.join("\n");

		return message.reply(
			Utils.embed({
				description: `${
					currentPlaying
						? `currently playing: ${currentPlaying}\n`
						: ""
				}${str}`,
				title: `queue for **${message.guild?.name}**`,
			})
		);
	},
} satisfies CommandData;
