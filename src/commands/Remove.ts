import { CommandData, Utils } from "@lib";
import { PlayerState } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer";

export default {
	cmd: "remove",
	exec: async (message) => {
		const gp = await GuildPlayer.create(message);

		/* check if the user is in a voice channel. */
		if (!gp.isInvokerInVoiceChannel()) {
			return message.reply("you must be in a vc");
		}

		/* check if a player exists for this guild. */
		if (!gp.isPlayerConnected()) {
			return message.reply("couldn't find a player for this guild.");
		}

		/* check if the invoker is in the player's voice channel. */
		if (!gp.isInvokerInCorrectVoiceChannel()) {
			return message.reply(
				`you're not in the correct voice channel. player already exists in <#${gp.player.voiceId}>`
			);
		}

		const index = Number.parseInt(
			message.content.substring(message.content.indexOf(" "))
		);

		if (isNaN(index)) return message.reply("invalid index.");

		/* remove the track from the queue. */
		const oldTrack = gp.player.queue.at(index - 1);
		gp.player.queue.remove(index - 1);

		return message.reply(
			`track [**${oldTrack?.title}**](${oldTrack?.uri}) was removed.`
		);
	},
} satisfies CommandData;
