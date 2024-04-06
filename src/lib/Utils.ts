import {
  EmbedBuilder,
  EmbedData,
  Message,
  MessagePayload,
  MessageReplyOptions,
} from "discord.js";
import { lstatSync, readdirSync } from "fs";
import { join, relative } from "path";

const __dirname = import.meta.dirname;

import type { NewsChannel, TextChannel, ThreadChannel } from "discord.js";

export type MessageChannel = TextChannel | ThreadChannel | NewsChannel;
export interface CommandData {
  cmd: string;
  description: string;
  alias?: string[];
  exec: (mesage: Message) => any;
}

export abstract class Utils {
  static PRIMARY_COLOR = 0xfff269;

  static fileToCommandMap = new Map<string, CommandData>();
  static commandToFileMap = new Map<string, string>();

  static embed(embed: EmbedData | string): MessageReplyOptions {
    const options: EmbedData =
      typeof embed === "string" ? { description: embed } : embed;
    options.color ??= Utils.PRIMARY_COLOR;

    return { embeds: [new EmbedBuilder(options)] };
  }

  static walk(directory: string): string[] {
    function read(dir: string, files: string[] = []) {
      for (const item of readdirSync(dir)) {
        const path = join(dir, item),
          stat = lstatSync(path);
        if (stat.isDirectory()) {
          files.concat(read(path, files));
        } else if (stat.isFile()) {
          files.push(path);
        }
      }

      return files;
    }

    return read(directory);
  }

  static async addCommand(
    relativeFilename: string,
    commandMap: Map<string, CommandData["exec"]>
  ) {
    const { default: command }: { default: CommandData } = await import(
      "file://" +
        join(__dirname, "../commands", relativeFilename) +
        `?version=${Number(new Date())}`
    );

    if (!command) {
      throw new Error(
        `[commands] command export not found in ${relativeFilename}`
      );
    }

    const commandSummary = [command.cmd, ...(command.alias ?? [])].map((v) =>
      v.toLowerCase()
    );

    // Check for duplicates
    const duplicateCommands = commandSummary
      .filter((cmd) => commandMap.has(cmd))
      .map((cmd) => [Utils.commandToFileMap.get(cmd), cmd]);

    if (duplicateCommands.length > 0) {
      throw new Error(
        `[commands] duplicate command(s) found: ${duplicateCommands
          .map(([file, cmd]) => `${cmd} => ${file}`)
          .join(", ")}`
      );
    }

    Utils.fileToCommandMap.set(relativeFilename, command);

    commandSummary.forEach((cmd) => {
      Utils.commandToFileMap.set(cmd, relativeFilename);
      commandMap.set(cmd, command.exec);
    });
  }

  static async removeCommand(
    relativeFilename: string,
    commandMap: Map<string, CommandData["exec"]>
  ) {
    const command = Utils.fileToCommandMap.get(relativeFilename);

    if (!command) {
      throw new Error(
        `[commands] file ${relativeFilename} not found in command map.`
      );
    }

    const commandSummary = [command.cmd, ...(command.alias ?? [])].map((v) =>
      v.toLowerCase()
    );

    commandSummary.forEach((cmd) => {
      Utils.commandToFileMap.delete(cmd);
      commandMap.delete(cmd);
    });

    Utils.fileToCommandMap.delete(relativeFilename);
  }

  static async watchDir(
    dir: string,
    commandMap: Map<string, CommandData["exec"]>
  ) {
    const { default: chokidar } = await import("chokidar");
    const watcher = chokidar.watch(dir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      cwd: join(__dirname, "../commands"),
    });

    watcher.on("add", (path) => {
      // ensure path hasn't been added to fileToCommandMap
      if (Utils.fileToCommandMap.has(path)) {
        return;
      }

      console.log(`[HMR] new: ${path}`);

      Utils.addCommand(path, commandMap)
        .then(() => console.log(`[HMR] added ${path}`))
        .catch((e) => console.error(`[HMR] error adding ${path}: ${e}`));
    });

    watcher.on("change", async (path) => {
      console.log(`[HMR] changed: ${path}`);

      let removeSuccess = false;
      let addSuccess = false;

      await Utils.removeCommand(path, commandMap)
        .then(() => (removeSuccess = true))
        .catch((e) => console.error(`[HMR] error removing ${path}: ${e}`));

      await Utils.addCommand(path, commandMap)
        .then(() => (addSuccess = true))
        .catch((e) => console.error(`[HMR] error adding ${path}: ${e}`));

      if (removeSuccess && addSuccess) {
        console.log(`[HMR] reloaded ${path}`);
      } else {
        console.error(`[HMR] error reloading ${path}`);
      }
    });

    watcher.on("unlink", (path) => {
      console.log(`[HMR] removed: ${path}`);

      Utils.removeCommand(path, commandMap)
        .then(() => console.log(`[HMR] removed ${path}`))
        .catch((e) => console.error(`[HMR] error removing ${path}: ${e}`));
    });
  }

  static async prepareCommands(
    dir: string,
    commands: Map<string, CommandData["exec"]>,
    watch = false
  ) {
    for (const path of Utils.walk(dir)) {
      // const { default: command }: { default: CommandData } = await import(path);
      // if (!command) {
      //   continue;
      // }

      const relativePath = relative(join(__dirname, "../commands"), path);
      await Utils.addCommand(relativePath, commands);
    }

    if (watch) {
      console.log("[HMR] watching for changes in commands directory.");
      await Utils.watchDir(dir, commands);
    }

    console.log(`[commands] loaded ${commands.size} commands.`);

    return commands;
  }
}
