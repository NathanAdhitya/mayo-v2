import { Message } from "discord.js";
import { Kazagumo, KazagumoPlayer, PlayerState } from "kazagumo";

export class GuildPlayer {
  private readonly kazagumo: Kazagumo;
  public player!: KazagumoPlayer;

  static async create(message: Message) {
    const gp = new GuildPlayer(message);
    await gp.createPlayer();
    return gp;
  }

  private constructor(private message: Message) {
    this.kazagumo = this.message.client.kazagumo;
  }

  private async createPlayer() {
    this.player =
      this.kazagumo.getPlayer(this.message.guild!.id) ??
      (await this.kazagumo.createPlayer({
        guildId: this.message.guild!.id,
        voiceId: this.message.member!.voice.channelId!,
        textId: this.message.channel.id,
      }));
  }

  public isInvokerInVoiceChannel() {
    return !!this.message.member?.voice.channelId;
  }

  public isInvokerInCorrectVoiceChannel() {
    return (
      this.message.member?.voice.channelId ===
      this.message.client.kazagumo.getPlayer(this.message.guild!.id)?.voiceId
    );
  }

  public isPlayerConnected() {
    return (
      this.player &&
      [PlayerState.CONNECTED, PlayerState.CONNECTING].includes(
        this.player.state
      ) &&
      this.player.voiceId
    );
  }

  public async ensureJoinedAndPlaying() {
    const channelId = await this.join();
    if (!this.player.playing) this.player.play();
    return channelId;
  }

  public async join() {
    return new Promise<string | null>((resolve) => {
      resolve(this.message.member!.voice.channelId!);

      try {
        this.player.setVoiceChannel(this.message.member!.voice.channelId!);
        this.player.setTextChannel(this.message.channel.id);
        this.player.connect();
      } catch (e) {}
    });
  }

  public async stop() {
    try {
      this.player.disconnect();
    } catch (e) {}

    try {
      await this.player.destroy();
    } catch (e) {}
  }
}
