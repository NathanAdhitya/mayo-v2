import { Client, GatewayIntentBits } from "discord.js";
import { Shoukaku, Connectors } from "shoukaku";
import { Kazagumo, Payload, Plugins } from "kazagumo";
import KazagumoSpotifyPlugin from "kazagumo-spotify";
import KazagumoDeezerPlugin from "stone-deezer";

export class Bot extends Client {
	readonly kazagumo: Kazagumo;

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildVoiceStates,
			],
		});

		// this.moon = new MoonlinkManager(
		// 	[
		// 		{
		// 			host: process.env.LAVA_HOST!,
		// 			password: process.env.LAVA_PASS!,
		// 			secure: true,
		// 			port: Number.parseInt(process.env.LAVA_PORT!),
		// 		},
		// 	],
		// 	{
		// 		spotify: {
		// 			clientId: process.env.SPOTIFY_CLIENT_ID!,
		// 			clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
		// 		},
		// 	},
		// 	(guild: string, sPayload: string) => {
		// 		this.guilds.cache.get(guild)!.shard.send(JSON.parse(sPayload));
		// 	}
		// );

		// this.on("ready", () => {
		// 	this.moon.init(this.user!.id);
		// });

		// this.on("raw", (data) => {
		// 	this.moon.packetUpdate(data);
		// });

		this.kazagumo = new Kazagumo(
			{
				defaultSearchEngine: "youtube",
				send: (guildId, payload) => {
					const guild = this.guilds.cache.get(guildId);
					if (guild) guild.shard.send(payload);
				},
				plugins: [
					new Plugins.PlayerMoved(this),
					new KazagumoSpotifyPlugin({
						clientId: process.env.SPOTIFY_CLIENT_ID!,
						clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
						searchMarket: "ID",
					}),
					new KazagumoDeezerPlugin(),
				],
			},
			new Connectors.DiscordJS(this),
			[
				{
					name: "Main",
					url: process.env.LAVA_HOST!,
					auth: process.env.LAVA_PASS!,
				},
			]
		);
	}
}

declare module "discord.js" {
	interface Client {
		readonly kazagumo: Kazagumo;
	}
}
