import { CommandData, Utils } from "../lib/index.js";
import { PlayerState } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer.js";

export default {
  cmd: "clear",
  description: "clear the queue",
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

    const clearedCount = gp.player.queue.length;
    gp.player.queue.clear();

    return message.reply(
      `cleared ${clearedCount} track${clearedCount > 1 ? "s" : ""}.`
    );
  },
} satisfies CommandData;
