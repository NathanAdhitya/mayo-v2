import { CommandData, MessageChannel, Utils } from "@lib";
import { SpotifyItemType } from "@lavaclient/spotify";

import type { Addable } from "@lavaclient/queue";

export default {
	cmd: "play",
	alias: ["p"],
	exec: async (message) => {
		const query = message.content.substring(
			message.content.indexOf(" ") + 1
		);
		if (query.length === 0)
			return message.reply("specify something to play :)");

		/* check if the invoker is in a vc. */
		const vc = message.guild?.voiceStates?.cache?.get(
			message.author.id
		)?.channel;
		if (!vc) {
			return message.reply("join a voice channel first.");
		}

		/* check if a player already exists, if so check if the invoker is in our vc. */
		let player = message.client.music.players.get(message.guild!.id);
		if (player && player.channelId !== vc.id && player.channelId !== null) {
			return message.reply(
				`player already exists in <#${player.channelId}> :(`
			);
		}

		let tracks: Addable[] = [],
			msg: string = "";
		if (message.client.music.spotify.isSpotifyUrl(query)) {
			const item = await message.client.music.spotify.load(query);
			switch (item?.type) {
				case SpotifyItemType.Track:
					const track = await item.resolveYoutubeTrack();
					tracks = [track];
					msg = `queued track [**${item.name}**](${query}).`;
					break;
				case SpotifyItemType.Artist:
					tracks = await item.resolveYoutubeTracks();
					msg = `queued the **Top ${tracks.length} tracks** for [**${item.name}**](${query}).`;
					break;
				case SpotifyItemType.Album:
				case SpotifyItemType.Playlist:
					tracks = await item.resolveYoutubeTracks();
					msg = `queued **${
						tracks.length
					} tracks** from ${SpotifyItemType[
						item.type
					].toLowerCase()} [**${item.name}**](${query}).`;
					break;
				default:
					return message.reply("sorry, couldn't find anything :/");
			}
		} else {
			const results = await message.client.music.rest.loadTracks(
				/^https?:\/\//.test(query) ? query : `ytsearch:${query}`
			);

			switch (results.loadType) {
				case "LOAD_FAILED":
				case "NO_MATCHES":
					return message.reply("no matches found...?");
				case "PLAYLIST_LOADED":
					tracks = results.tracks;
					msg = `queued playlist [**${results.playlistInfo.name}**](${query}), it has a total of **${tracks.length}** tracks.`;
					break;
				case "TRACK_LOADED":
				case "SEARCH_RESULT":
					if (results.tracks.length > 1) {
						const maxSearchResults =
							results.tracks.length < 5
								? results.tracks.length
								: 5;
						const trackSelection = results.tracks
							.slice(0, maxSearchResults)
							.map(
								(track, index) =>
									`${++index} - \`${track.info.title}\``
							)
							.join("\n");

						message.reply(
							`choose from the search below (reply with number or cancel):\n${trackSelection}`
						);

						const collector =
							message.channel.createMessageCollector({
								filter: (m) =>
									m.author.id === message.author.id &&
									/^(\d+|!play.*|cancel)$/i.test(m.content),
								max: 1,
								time: 30e3,
							});

						const collectorResult = await new Promise((resolve) => {
							collector.on("collect", (m) => {
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
								tracks = [track];

								msg = `enqueuing [${track.info.title}]`;
								resolve(true);
							});

							collector.on("end", async (collected) => {
								if (collected.size !== 0) return;
								await message.reply(
									"you didn't provide a selection."
								);
								resolve(false);
							});
						});
						if (collectorResult === false) return;
					} else {
						const [track] = results.tracks;
						tracks = [track];
						msg = `enqueuing [${track.info.title}]`;
					}

					break;
			}
		}

		/* create a player and/or join the member's vc. */
		if (!player?.connected) {
			player ??= message.client.music.createPlayer(message.guild!.id);
			player.queue.channel = message.channel as MessageChannel;
			await player.connect(vc.id, { deafened: true });
		}

		/* reply with the queued message. */
		const started = player.playing || player.paused;
		await message.reply(msg);

		/* do queue tings. */
		player.queue.add(tracks, { requester: message.author.id });
		if (!started) {
			await player.queue.start();
		}
	},
} satisfies CommandData;
