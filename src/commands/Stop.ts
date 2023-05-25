import { CommandData, Utils } from "@lib";
import { PlayerState } from "kazagumo";

export default {
	cmd: "stop",
	exec: async (message) => {
		/* check if a player exists for this guild. */
		const player = message.client.kazagumo.getPlayer(message.guild!.id);
		if (!player) {
			return message.reply("couldn't find a player for this guild.");
		}

		await message.reply(`left <#${player.voiceId}>`);

		/* leave the player's voice channel. */
		try {
			player.disconnect();
		} catch (e) {}

		try {
			player.destroy();
		} catch (e) {}

		player.queue.clear();
	},
} satisfies CommandData;
