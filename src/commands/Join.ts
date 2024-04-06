import { CommandData, Utils } from "../lib/index.js";
import { GuildPlayer } from "../lib/GuildPlayer.js";

export default {
  cmd: "join",
  description: "join your current vc",
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
