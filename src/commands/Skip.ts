import { CommandData, Utils } from "@lib";
import { PlayerState } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer";

export default {
	cmd: "skip",
	exec: async (message) => {
		const gp = await GuildPlayer.create(message);

		/* check if a player exists for this guild. */
		if (!gp.isPlayerConnected()) {
			return message.reply("couldn't find a player for this guild.");
		}

		/* check if the invoker is in a voice channel. */
		if (!gp.isInvokerInVoiceChannel()) {
			return message.reply("you must be in a vc");
		}

		/* check if the invoker is in the player's voice channel. */
		if (!gp.isInvokerInCorrectVoiceChannel()) {
			return message.reply(
				`you're not in the correct voice channel. player already exists in <#${gp.player.voiceId}>`
			);
		}

		if (gp.player.queue.totalSize === 0)
			return message.reply("queue is empty?");

		const currentPlaying = gp.player.queue.current?.title;

		/* skip and go to next. */
		await gp.player.skip();

		await message.reply(`skipping ${currentPlaying}`);
	},
} satisfies CommandData;
