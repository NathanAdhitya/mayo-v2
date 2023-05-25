import { CommandData, MessageChannel, Utils } from "@lib";
import { PlayerState } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer";

export default {
	cmd: "join",
	exec: async (message) => {
		const gp = await GuildPlayer.create(message);

		/* check if the invoker is in a voice channel. */
		if (!gp.isInvokerInVoiceChannel()) {
			return message.reply("you must be in a vc");
		}

		/* check if a player already exists for this guild. */
		if (gp.isPlayerConnected()) {
			return message.reply("already connected to a vc.");
		}

		/* join the invoker's voice channel. */
		const vc = await gp.ensureJoinedAndPlaying();

		return message.reply(`joined <#${vc}>`);
	},
} satisfies CommandData;
