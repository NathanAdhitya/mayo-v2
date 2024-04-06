import { CommandData, Utils } from "../lib/index.js";

export default {
  cmd: "mayohelp",
  description: "command info",
  exec: async (message) => {
    const prefix = process.env.BOT_PREFIX;
    const cmdHelps = Array.from(Utils.fileToCommandMap.values()).map((v) => [
      v.cmd,
      v.description,
    ]);

    const msg =
      "**is mayonnaise an instrument?**\n" +
      "*no patrick, mayonnaise is not an instrument*\n" +
      "__a personal music bot by Nathan\n\n__" +
      cmdHelps.map((v) => `${prefix}${v[0]} - ${v[1]}`).join("\n");

    return message.reply(msg);
  },
} satisfies CommandData;
