import { CommandData, Utils } from "../lib/index.js";
import { KazagumoTrack, PlayerState } from "kazagumo";
import { GuildPlayer } from "../lib/GuildPlayer.js";
import { escapeMarkdown, hyperlink } from "discord.js";

const formatIndex = (index: number, size: number) =>
  (index + 1).toString().padStart(size.toString().length, "0");

const pageMax = 10;

export default {
  cmd: "queue",
  description: "ooh what's playing?",
  exec: async (message) => {
    const gp = await GuildPlayer.create(message);

    /* check if a player exists for this guild. */
    if (!gp.isPlayerConnected()) {
      return message.reply("couldn't find a player for this guild.");
    }

    const player = gp.player;

    const query = message.content.substring(message.content.indexOf(" ") + 1);
    const requestedPage = parseInt(query);

    const page = isNaN(requestedPage) ? 1 : requestedPage;
    const trackStartIdx = (page - 1) * pageMax;
    const trackEndIdx = page * pageMax;

    const currentlyPlaying = player.queue.current;
    const isCurrentlyPlaying = currentlyPlaying instanceof KazagumoTrack;

    /* check if the queue is empty. */
    if (player.queue.isEmpty) {
      return message.reply(
        `${
          isCurrentlyPlaying
            ? `currently playing: ${
                currentlyPlaying.uri
                  ? hyperlink(
                      escapeMarkdown(currentlyPlaying.title),
                      currentlyPlaying.uri
                    )
                  : escapeMarkdown(currentlyPlaying.title)
              } requested by ${currentlyPlaying.requester}\n\n`
            : "not playing anything right now.\n"
        }there are no tracks in the queue.`
      );
    }

    /* respond with an embed of the queue. */
    const size = player.queue.size;
    const slicedTracks = player.queue
      .slice(trackStartIdx, trackEndIdx)
      .map(
        (t, idx) =>
          `\`#${formatIndex(idx, size)}\` ${
            t.uri
              ? hyperlink(escapeMarkdown(t.title), t.uri)
              : escapeMarkdown(t.title)
          } ${t.requester}`
      );
    const str = slicedTracks.join("\n");

    const fullDescription = `${
      currentlyPlaying
        ? `currently playing: ${
            currentlyPlaying.uri
              ? hyperlink(
                  escapeMarkdown(currentlyPlaying.title),
                  currentlyPlaying.uri
                )
              : escapeMarkdown(currentlyPlaying.title)
          } requested by ${currentlyPlaying.requester}\n\n`
        : "not playing anything right now.\n"
    }${str}`;

    const truncatedDescription =
      fullDescription.length > 4096
        ? fullDescription.substring(0, 4092) + "..."
        : fullDescription;

    return message.reply(
      Utils.embed({
        description: truncatedDescription,
        title: `queue for **${message.guild?.name}**`,
        footer: {
          text: `page ${page}/${Math.ceil(size / pageMax)} - showing ${Math.min(
            slicedTracks.length,
            pageMax
          )} track${
            slicedTracks.length !== 1 ? "s" : ""
          } out of ${size} total.\n${process.env
            .BOT_PREFIX!}queue <page> to view more.\n${process.env
            .BOT_PREFIX!}remove <index> to remove a track.`,
        },
      })
    );
  },
} satisfies CommandData;
