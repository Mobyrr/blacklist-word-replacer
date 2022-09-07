import { GuildMember, PermissionFlagsBits, PermissionResolvable, PermissionsBitField, TextChannel, ThreadChannel, User, Webhook } from "discord.js";
import { resolve } from "path";
import MapFile from "./MapFile";
import SyncQueue from "./SyncQueue";


export default class Util {
    public static wordsMaps = new Map<string, MapFile>();

    public static getServerMap(guildID: string): MapFile {
        let map = this.wordsMaps.get(guildID);
        if (map === undefined) {
            map = new MapFile(resolve(__dirname, "../../maps", guildID));
            this.wordsMaps.set(guildID, map);
        }
        return map;
    }

    public static readonly MESSAGE_MAX_LENGTH = 2000;
    public static readonly THREAD_MAX_LENGTH = 100;
    public static readonly EMBED_MAX_NUMBER = 10;

    //too lazy to make all the cases
    private static permissionToStrMap: Map<bigint, string> = new Map([
        [PermissionFlagsBits.ManageMessages, "Gérer les messages"],
        [PermissionFlagsBits.ManageWebhooks, "Gérer les webhooks"],
    ]);

    private static webhookQueue: SyncQueue = new SyncQueue();

    public static getMissingPermissionsMessage(member: GuildMember, channel: TextChannel | ThreadChannel | null,
        permissions: PermissionResolvable): string {
        let missingPermissions: (string | undefined)[] = [];
        let missing: string[];
        if (channel !== null) {
            missing = channel.permissionsFor(member)?.missing(permissions);
        } else {
            missing = member.permissions.missing(permissions);
        }
        for (let p of missing) {
            missingPermissions.push(this.permissionToStr(p as any));
        }
        if (missingPermissions.length === 1) {
            return "\"" + missingPermissions[0] + "\"";
        } else if (missingPermissions.length > 1) {
            return "\"" + missingPermissions.slice(0, missingPermissions.length - 1).join("\", \"")
                + "\" et \"" + missingPermissions[missingPermissions.length - 1] + "\"";
        }
        return "";
    }

    public static permissionToStr(permission: PermissionResolvable): string | undefined {
        return this.permissionToStrMap.get(PermissionsBitField.resolve(permission));
    }

    public static async getWebhook(channel: TextChannel): Promise<Webhook> {
        let wh: Webhook | undefined;
        wh = (await channel.fetchWebhooks()).find(w => {
            if (!(w.owner instanceof User)) return false;
            return w.owner.id === channel.client.user?.id;
        });
        if (wh === undefined) {
            let avatar = channel.client.user?.avatarURL({ extension: "png" });
            if (avatar === null) avatar = undefined;
            wh = await channel.createWebhook({ name: "Word replacer webhook", avatar: avatar });
        }
        return wh;
    }
}