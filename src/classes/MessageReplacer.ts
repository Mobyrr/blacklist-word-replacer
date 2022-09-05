import * as assert from "assert";
import { Message, TextChannel, ThreadChannel, MessageType, PermissionFlagsBits, Attachment, Embed, EmbedBuilder, APIEmbed, MessageSelectOption } from "discord.js";
import MapFile from "./MapFile";
import Util from "./Util";

export default class MessageReplacer {
    static readonly normalizerRegex = /\p{Diacritic}|[^ a-zA-Z\d]/gu;

    public static async replaceMsg(msg: Message, map: MapFile): Promise<void> {
        if (!msg.member) return;
        assert(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel);
        assert(msg.type === MessageType.Default || msg.type === MessageType.Reply);
        let parentChannel = msg.channel;
        if (parentChannel instanceof ThreadChannel) {
            if (!(parentChannel.parent instanceof TextChannel)) return;
            parentChannel = parentChannel.parent;
        }
        if ((msg.content.includes("@everyone") || msg.content.includes("@here"))
            && parentChannel.permissionsFor(msg.member)?.has(PermissionFlagsBits.MentionEveryone)) {
            return; // don't replace important messages that pings everyone
        }
        let newMsg = MessageReplacer.transformMessage(msg.content, map);
        if (newMsg === null) return; // null = no need to replace
        assert(msg.client.user?.id !== undefined)
        let botMember = parentChannel.members.get(msg.client.user.id);
        assert(botMember !== undefined);
        let missingPermissions = Util.getMissingPermissionsMessage(botMember, msg.channel, 
            [PermissionFlagsBits.ManageWebhooks, PermissionFlagsBits.ManageMessages])
        if (missingPermissions !== "") {
            msg.channel.send("Je n'ai pas les permissions suivantes pour remplacer le message : " + missingPermissions
                + ".\n Si cela est volontaire, veuillez me retirer l'accès à ce salon.");
        }
        try { setTimeout(() => { msg.delete() }, 150) } catch { }
        assert(newMsg !== null && parentChannel instanceof TextChannel);
        let nickname = msg.member?.nickname;
        nickname = nickname == null ? msg.author.username : nickname;
        let avatar: string | null | undefined = msg.author.avatarURL({ extension: "png" });
        if (avatar === null) avatar = undefined;
        let wh = await Util.getWebhook(parentChannel);
        for (let i = 0; i < newMsg.length && i !== 3 * Util.MESSAGE_MAX_LENGTH; i += Util.MESSAGE_MAX_LENGTH) {
            let msgAttachements: Attachment[] = [];
            let embeds: EmbedBuilder[] = [];
            if (i + Util.MESSAGE_MAX_LENGTH >= newMsg.length) {
                msg.attachments.each(a => {
                    msgAttachements.push(a);
                });
                for (let msgEmbed of msg.embeds) {
                    embeds.push(new EmbedBuilder(msgEmbed.data));
                }
                if (msg.reference !== null && msg.reference.messageId !== undefined) {
                    let reference = msg.channel.messages.cache.get(msg.reference.messageId);
                    if (reference === undefined) return;
                    let color = reference.member?.displayHexColor;
                    embeds.unshift(new EmbedBuilder()
                        .setTitle("En réponse à " + (msg.mentions.has(reference.author, { ignoreRoles: true, ignoreEveryone: true }) ? "@" : "")
                            + (reference.member?.nickname === null || reference.member?.nickname === undefined ? reference.author.username : reference.member?.nickname))
                        .setURL(reference.url)
                        .setColor(color == null ? "#4f545c" : color));
                    embeds.splice(Util.EMBED_MAX_NUMBER, 1);
                }
            }
            wh.send({
                content: newMsg.slice(i, i + Util.MESSAGE_MAX_LENGTH),
                threadId: msg.channel.isThread() ? msg.channel.id : undefined,
                avatarURL: avatar,
                username: nickname,
                files: msgAttachements,
                embeds: embeds
            });
        }
    }

    /**
     * @returns null if the message has not been changed, otherwise the transformed message
     */
    public static transformMessage(msg: string, map: MapFile): string | null {
        let newMsg = msg;
        let data = MessageReplacer.normalizeKey(newMsg);
        let keys: KeyData[] = [];
        for (let i = 0; i < data.value.length; i++) {
            while (data.value[i] === " ") i++;
            for (let key of map.keys()) {
                let v = map.get(key);
                assert(v !== undefined);
                keys.push({ value: key, index: 0, start: i, valid: false, priority: 0 });
                //keys.push({ value: key, index: 0, start: i, valid: false, priority: parseInt(v[1]) });
            }
            let nextKeys: KeyData[] = [];
            let letter = data.value[i];
            while (data.value[i + 1] === letter) i++;
            for (let j = 0; j < keys.length; j++) {
                let key = keys[j];
                while (key.value[key.index] === " ") key.index++;
                if (data.value[i] === key.value[key.index]) {
                    nextKeys.push(key);
                    let letter = key.value[key.index];
                    while (key.value[key.index] === letter) key.index++;
                    if (key.index === key.value.length) {
                        key.valid = true;
                    }
                } else {
                    keys.splice(keys.indexOf(key), 1);
                    j--;
                }
            }
            let key = getValidKey(keys);
            if (key !== null) {
                let value = map.get(key.value);
                assert(value !== undefined);
                newMsg =
                    newMsg.slice(0, data.indexList[key.start]) + value[0]
                    + newMsg.slice(data.indexList[i] + 1, newMsg.length);
                data = MessageReplacer.normalizeKey(newMsg);
                i = key.start + MessageReplacer.normalizeKey(value[0]).value.length - 1;
                nextKeys = [];
            }
            keys = nextKeys;
        }
        return newMsg === msg ? null : newMsg;
    }

    public static normalizeKey(key: string): NormalizedKey {
        let indexTab: number[] = [];
        let result = "";
        let wasSpace = true;
        for (let i = 0; i < key.length; i++) {
            let newChar = key[i].normalize("NFD").replace(this.normalizerRegex, "");
            if (newChar === "") continue;
            if (newChar === " ") {
                if (wasSpace) continue;
                wasSpace = true;
            } else {
                wasSpace = false;
            }
            result += newChar.toLowerCase();
            indexTab.push(i);
        }
        if (result[result.length - 1] === " ") {
            result = result.slice(0, result.length - 1);
            indexTab.pop();
        }
        return { value: result, indexList: indexTab }
    }
}

interface NormalizedKey {
    value: string;
    indexList: number[];
}

interface KeyData {
    value: string;
    index: number;
    start: number;
    valid: boolean;
    priority: number;
};

function getValidKey(keys: KeyData[]): KeyData | null {
    if (keys.length === 0) return null;
    let bestKey: KeyData = keys[0];
    for (let i = 1; i < keys.length; i++) {
        if (keys[i].priority > bestKey.priority) {
            bestKey = keys[i];
        } else if (keys[i].valid && keys[i].priority >= bestKey.priority) {
            bestKey = keys[i];
        }
    }
    return bestKey.valid ? bestKey : null;
}
