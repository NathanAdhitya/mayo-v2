import "@lavaclient/queue/register";
import type { MessageChannel } from "./Utils";

export * from "./Bot";
export * from "./Utils";

declare module "lavaclient" {
    interface Player {
        nightcore: boolean;
    }
}

declare module "@lavaclient/queue" {
    interface Queue {
        channel: MessageChannel;
    }
}



