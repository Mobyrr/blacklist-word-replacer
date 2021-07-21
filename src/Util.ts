import { GuildMember, PermissionFlags, PermissionResolvable, Permissions, TextChannel } from "discord.js";


export default class Util {
    //too lazy to make all the cases
    private static permissionToStrMap: Map<number, string> = new Map([
        [Permissions.FLAGS.MANAGE_MESSAGES, "Gérer les messages"],
        [Permissions.FLAGS.MANAGE_WEBHOOKS, "Gérer les webhooks"]
    ]);

    public static checkPermission(failureMessage: string, member: GuildMember, channel: TextChannel, permissions: PermissionResolvable[]): boolean {
        let missingPermissions: (string | undefined)[] = [];
        for (let p of permissions) {
            if (!channel.permissionsFor(member)?.has(p)) {
                missingPermissions.push(this.permissionToStr(p));
            }
        }
        if (missingPermissions.length === 1) {
            channel.send(failureMessage + "\n" + "Raison : " + member.user.tag + " n'a pas la permission \"" + missingPermissions[0] + "\"");
            return false;
        } else if (missingPermissions.length > 1) {
            channel.send(failureMessage + "\n" + "Raison : " + member.user.tag + " n'a pas les permissions \""
                + missingPermissions.slice(0, missingPermissions.length - 1).join("\", \"")
                + "\" et \"" + missingPermissions[missingPermissions.length - 1] + "\"");
            return false;
        }
        return true;
    }

    public static permissionToStr(permission: PermissionResolvable): string | undefined {
        return this.permissionToStrMap.get(Permissions.resolve(permission));
    }
}