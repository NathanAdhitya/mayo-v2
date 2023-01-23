import { EmbedBuilder, EmbedData, Message, MessagePayload, MessageReplyOptions } from "discord.js";
import { lstatSync, readdirSync } from "fs";
import { join } from "path";

import type { NewsChannel, TextChannel, ThreadChannel } from "discord.js";

export type MessageChannel = TextChannel | ThreadChannel | NewsChannel;
export interface CommandData {
    cmd: string;
    alias?: string[];
    exec: (mesage: Message) => any;
}

export abstract class Utils {
    static PRIMARY_COLOR = 0xfff269;

    static embed(embed: EmbedData | string): MessageReplyOptions {
        const options: EmbedData = typeof embed === "string" ? { description: embed } : embed;
        options.color ??= Utils.PRIMARY_COLOR;

        return {embeds: [new EmbedBuilder(options)]};
    }

    static walk(directory: string): string[] {
        function read(dir: string, files: string[] = []) {
            for (const item of readdirSync(dir)) {
                const path = join(dir, item), stat = lstatSync(path)
                if (stat.isDirectory()) {
                    files.concat(read(path, files))
                } else if (stat.isFile()) {
                    files.push(path);
                }
            }

            return files;
        }

        return read(directory);
    }

    static async prepareCommands(dir: string) {
        const commands: Map<string, CommandData["exec"]> = new Map();
        for (const path of Utils.walk(dir)) {
            const { default: command }: {default: CommandData} = await import(path);
            if (!command) {
                continue;
            }

            commands.set(command.cmd.toLowerCase(), command.exec);
            if(Array.isArray(command.alias)){
                command.alias.forEach((alias) => {
                    commands.set(alias.toLowerCase(), command.exec);
                })
            }
        }

        return commands;
    }
}
