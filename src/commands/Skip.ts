import { CommandData, Utils } from "../lib/index.js";
import { PlayerState } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer.js";
import { escapeMarkdown } from "discord.js";

export default {
  cmd: "skip",
  description: "skip the current track, can specify how many to skip",
  exec: async (message) => {
    const gp = await GuildPlayer.create(message);

    const query = message.content.substring(message.content.indexOf(" ") + 1);
    const skipCount = Number.isNaN(parseInt(query)) ? 1 : parseInt(query);

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

    // if skipping more than one
    if (skipCount > 1) {
      gp.player.queue.splice(0, skipCount - 1);
    }

    /* skip and go to next. */
    await gp.player.skip();

    if (skipCount > 1) {
      return message.reply(`skipped ${skipCount} tracks`);
    } else {
      await message.reply(
        `skipping ${escapeMarkdown(currentPlaying ?? "current track")}`
      );
    }
  },
} satisfies CommandData;
