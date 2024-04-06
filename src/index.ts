import "dotenv/config";

import { Bot, CommandData, Utils } from "./lib/index.js";
import { join } from "path";
import { ChannelType, Message, escapeMarkdown, hyperlink } from "discord.js";

const client = new Bot();
let commandMap: Map<string, CommandData["exec"]> = new Map();
const guildPlayerTimeouts = new Map<string, NodeJS.Timeout>();
const playerIdleTimeoutMs = 5 * 60 * 1000;
const __dirname = import.meta.dirname;

client.kazagumo.shoukaku.on("ready", (name) =>
  console.log(`[music] Lavalink ${name}: Ready!`)
);
client.kazagumo.shoukaku.on("error", (name, error) =>
  console.error(`[music] Lavalink ${name}: Error Caught,`, error)
);
client.kazagumo.shoukaku.on("close", (name, code, reason) =>
  console.warn(
    `[music] Lavalink ${name}: Closed, Code ${code}, Reason ${
      reason || "No reason"
    }`
  )
);
client.kazagumo.shoukaku.on("disconnect", (name, reason) =>
  console.warn(
    `[music] Lavalink ${name}: Disconnected, Reason ${reason || "No reason"}`
  )
);

client.kazagumo.on("playerEmpty", (player) => {
  if (!player) return;
  if (!player.textId) return;

  const originalChannel = client.channels.cache.get(player.textId);
  if (originalChannel && originalChannel.type === ChannelType.GuildText)
    originalChannel.send("uh oh, the queue has ended :/");

  // Set a timeout of 5 minutes before disconnecting
  guildPlayerTimeouts.set(
    player.guildId,
    setTimeout(async () => {
      try {
        player.disconnect();
        await player.destroy();
      } catch (e) {}
    }, playerIdleTimeoutMs)
  );
});

client.kazagumo.on("playerStart", (player, track) => {
  if (!player) return;
  if (!player.textId) return;
  const originalChannel = client.channels.cache.get(player.textId);

  try {
    // Cancel timeout if it exists
    const timeout = guildPlayerTimeouts.get(player.guildId);
    if (timeout !== undefined) {
      clearTimeout(timeout);
      guildPlayerTimeouts.delete(player.guildId);
    }

    if (originalChannel && originalChannel.type === ChannelType.GuildText)
      originalChannel.send({
        content: `now playing ${
          track.uri
            ? hyperlink(escapeMarkdown(track.title), track.uri)
            : escapeMarkdown(track.title)
        } ${track.requester ? `requested by ${track.requester}` : ""}`,
        allowedMentions: { parse: [] },
      });
  } catch (e) {
    console.error(e);
  }
});

client.kazagumo.shoukaku.on("error", (_, error) => console.error(error));

client.on("ready", async () => {
  await Utils.prepareCommands(
    join(__dirname, "commands"),
    commandMap,
    process.env.HMR == "true"
  );

  client.user!.setActivity(`music. ${process.env.BOT_PREFIX}mayohelp`);
  console.log("[discord] ready!");
});

client.on("messageCreate", (message) => {
  if (!message.content.startsWith(process.env.BOT_PREFIX!)) return;
  if (message.author.bot) return;

  const cmdName = message.content.split(" ")[0].substring(1).toLowerCase();
  const cmdData = commandMap.get(cmdName);
  if (cmdData !== undefined) {
    try {
      cmdData(message);
    } catch (e) {
      message.channel.send(
        Utils.embed(`an error occurred while executing the command: \`${e}\``)
      );
    }
  }
});

client.login(process.env.BOT_TOKEN);
