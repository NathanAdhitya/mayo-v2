import { CommandData, Utils } from "@lib";

export default {
	cmd: "stop",
	exec: async (message) => {
		/* check if a player exists for this guild. */
		const player = message.client.music.players.get(message.guild!.id);
		if (!player?.connected) {
			return message.reply("couldn't find a player for this guild.");
		}

		await message.reply(`left <#${player.channelId}>`);

		/* leave the player's voice channel. */
		player.disconnect();
		message.client.music.destroyPlayer(player.guildId);
	},
} satisfies CommandData;
