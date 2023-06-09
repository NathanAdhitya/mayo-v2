import { CommandData, Utils } from "@lib";
import { PlayerState } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer";

const formatIndex = (index: number, size: number) =>
	(index + 1).toString().padStart(size.toString().length, "0");

export default {
	cmd: "queue",
	exec: async (message) => {
		const gp = await GuildPlayer.create(message);

		/* check if a player exists for this guild. */
		if (!gp.isPlayerConnected()) {
			return message.reply("couldn't find a player for this guild.");
		}

		const player = gp.player;

		const currentPlaying = player.queue.current?.title;

		/* check if the queue is empty. */
		if (player.queue.isEmpty) {
			return message.reply(
				`${
					currentPlaying
						? `currently playing: ${currentPlaying}\n`
						: ""
				}there are no tracks in the queue.`
			);
		}

		/* respond with an embed of the queue. */
		const size = player.queue.size;
		const str = player.queue
			.map(
				(t, idx) =>
					`\`#${formatIndex(idx, size)}\` [**${t.title}**](${
						t.uri
					}) ${t.requester ? `<@${t.requester}>` : ""}`
			)
			.join("\n");

		const fullDescription = `${
			currentPlaying ? `currently playing: ${currentPlaying}\n` : ""
		}${str}`;

		const truncatedDescription =
			fullDescription.length > 2048
				? fullDescription.substring(0, 2045) + "..."
				: fullDescription;

		return message.reply(
			Utils.embed({
				description: truncatedDescription,
				title: `queue for **${message.guild?.name}**`,
			})
		);
	},
} satisfies CommandData;
