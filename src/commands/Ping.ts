import { CommandData, Utils } from "../lib/index.js";

export default {
  cmd: "ping",
  description: "pong",
  exec: async (message) => {
    message.reply(
      `pong! **heartbeat:** *${Math.round(message.client.ws.ping)}ms*`
    );
  },
} satisfies CommandData;
