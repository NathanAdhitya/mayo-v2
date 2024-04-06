import { CommandData, MessageChannel, Utils } from "@lib";
import { PlayerState, SearchResultTypes } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer";

export default {
  cmd: "play",
  alias: ["p"],
  exec: async (message) => {
    const gp = await GuildPlayer.create(message);

    const query = message.content.substring(message.content.indexOf(" ") + 1);
    if (query.length === 0)
      return message.reply("specify something to play :)");

    /* check if the invoker is in a vc. */
    if (!gp.isInvokerInVoiceChannel()) {
      return message.reply("you must be in a vc");
    }

    /* check if a player already exists, if so check if the invoker is in our vc. */
    if (gp.isPlayerConnected()) {
      if (!gp.isInvokerInCorrectVoiceChannel()) {
        return message.reply(
          `you're not in the correct voice channel. player already exists in <#${gp.player.voiceId}>`
        );
      }
    }

    const player = gp.player;

    const results = await player.search(query, {
      requester: message.author,
    });

    let msg: string = "";

    if (results) {
      if (results.type === "PLAYLIST") {
        player.queue.add(results.tracks);
        msg = `queued playlist [**${results.playlistName}**](${query}), it has a total of **${results.tracks.length}** tracks.`;
      } else if (results.type === "SEARCH") {
        if (results.tracks.length > 1) {
          const maxSearchResults =
            results.tracks.length < 5 ? results.tracks.length : 5;
          const trackSelection = results.tracks
            .slice(0, maxSearchResults)
            .map((track, index) => `${++index} - \`${track.title}\``)
            .join("\n");

          message.reply(
            `choose from the search below (reply with number or cancel):\n${trackSelection}`
          );

          const collector = message.channel.createMessageCollector({
            filter: (m) =>
              m.author.id === message.author.id &&
              /^(\d+|!play.*|cancel)$/i.test(m.content),
            max: 1,
            time: 30e3,
          });

          const collectorResult = await new Promise((resolve) => {
            collector.on("collect", async (m) => {
              const first = m.content;
              if (
                first.toLowerCase().startsWith("!play") ||
                first.toLowerCase().startsWith("cancel")
              ) {
                message.reply("cancelled selection.");
                return resolve(false);
              }

              const index = Number.parseInt(first, 10) - 1;
              if (
                !Number.isInteger(index) ||
                index < 0 ||
                index > maxSearchResults - 1
              ) {
                message.reply(
                  `the number you provided too small or too big (1-${maxSearchResults}).`
                );
                return resolve(false);
              }

              const track = results.tracks[index];
              if (!track) {
                message.reply("error: cannot find track.");
                return resolve(false);
              }

              player.queue.add(track);
              msg = `enqueuing [${track.title}]`;
              resolve(true);
            });

            collector.on("end", async (collected) => {
              if (collected.size !== 0) return;
              await message.reply("you didn't provide a selection.");
              resolve(false);
            });
          });
          if (collectorResult === false) return;
        } else {
          const [track] = results.tracks;
          if (!track) return message.reply("error: cannot find track.");

          player.queue.add(track);
          msg = `enqueuing [${track.title}]`;
        }
      } else if (results.type === "TRACK") {
        const [track] = results.tracks;
        player.queue.add(track);
        msg = `enqueuing [${track.title}]`;
      }
    } else {
      return message.reply("no matches found...?");
    }

    /* create a player and/or join the member's vc. */
    gp.ensureJoinedAndPlaying();
    return message.reply(msg);
  },
} satisfies CommandData;
