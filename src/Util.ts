import { GuildMember, PermissionFlags, PermissionResolvable, Permissions, TextChannel, ThreadChannel } from "discord.js";


export default class Util {
    public static readonly MESSAGE_MAX_LENGTH = 2000;
    public static readonly THREAD_MAX_LENGTH = 100;
    public static readonly EMBED_MAX_NUMBER = 10;

    //too lazy to make all the cases
    private static permissionToStrMap: Map<bigint, string> = new Map([
        [Permissions.FLAGS.MANAGE_MESSAGES, "Gérer les messages"],
        [Permissions.FLAGS.MANAGE_WEBHOOKS, "Gérer les webhooks"]
    ]);

    public static sendMissingPermissions(failureMessage: string, member: GuildMember, channel: TextChannel | ThreadChannel,
        permissions: PermissionResolvable[]): boolean {
        let missingPermissions: (string | undefined)[] = [];
        for (let p of permissions) {
            if (!channel.permissionsFor(member)?.has(p)) {
                missingPermissions.push(this.permissionToStr(p));
            }
        }
        if (missingPermissions.length === 1) {
            channel.send(failureMessage + "\n" + "Raison : " + member.user.tag + " n'a pas la permission \"" + missingPermissions[0] + "\"");
            return true;
        } else if (missingPermissions.length > 1) {
            channel.send(failureMessage + "\n" + "Raison : " + member.user.tag + " n'a pas les permissions \""
                + missingPermissions.slice(0, missingPermissions.length - 1).join("\", \"")
                + "\" et \"" + missingPermissions[missingPermissions.length - 1] + "\"");
            return true;
        }
        return false;
    }

    public static permissionToStr(permission: PermissionResolvable): string | undefined {
        return this.permissionToStrMap.get(Permissions.resolve(permission));
    }
}