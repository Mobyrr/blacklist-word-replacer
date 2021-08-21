import * as fs from "fs";
import { Client, Message, Permissions, TextChannel, ThreadChannel, User, Webhook, MessageAttachment, MessageEmbed } from "discord.js";
import { resolve } from "path";
import MapFile from "./MapFile";
import { config } from "dotenv";
import MessageReplacer from "./MessageReplacer";
import syncQueue from "./SyncQueue";
import Util from "./Util";
import * as assert from "assert";

config({ path: resolve(__dirname, "../.env") });

const client = new Client({
    allowedMentions: { parse: [] },
    intents: ['GUILDS', 'GUILD_MESSAGES']
});
let botID: string;
const prefix = "!";
let maps = new Map<string, MapFile>();
let webhookQueue = new syncQueue();

async function verifyMsg(msg: Message, map: MapFile): Promise<void> {
    if (!msg.member) return;
    assert(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel);
    assert(msg.type === "DEFAULT" || msg.type === "REPLY");
    let parentChannel = msg.channel;
    if (parentChannel instanceof ThreadChannel) {
        if (!(parentChannel.parent instanceof TextChannel)) return;
        parentChannel = parentChannel.parent;
    }
    if ((msg.content.includes("@everyone") || msg.content.includes("@here"))
        && parentChannel.permissionsFor(msg.member)?.has("MENTION_EVERYONE")) {
        return; // don't replace messages that pings everyone for avoid annoying the staff
    }
    let newMsg = MessageReplacer.transformMessage(msg.content, map);
    if (newMsg === null) return; // no need to replace
    let botMember = parentChannel.members.get(botID);
    assert(botMember !== undefined);
    if (Util.sendMissingPermissions("Remplacement du message précédent échoué", botMember, msg.channel,
        [Permissions.FLAGS.MANAGE_WEBHOOKS, Permissions.FLAGS.MANAGE_MESSAGES])) {
        return;
    }

    try { setTimeout(() => { msg.delete() }, 0.2) } catch { }
    webhookQueue.add(async () => {
        assert(newMsg !== null && parentChannel instanceof TextChannel);
        let wh: Webhook | undefined;
        let whError = "Échec de la création/récupération du webhook, veuillez contacter Mobyr !";
        let nickname = msg.member?.nickname;
        nickname = nickname == null ? msg.author.username : nickname;
        let avatar: string | null | undefined = msg.author.avatarURL({ format: "png" });
        if (avatar === null) avatar = undefined;
        try {
            wh = (await parentChannel.fetchWebhooks()).find(w => {
                if (!(w.owner instanceof User)) return false;
                return w.owner.id === botMember?.id;
            });
            if (wh == undefined) {
                let avatar = botMember?.user.avatarURL({ format: "png" });
                if (avatar === null) avatar = undefined;
                wh = await parentChannel.createWebhook("Word replacer webhook", { avatar: avatar });
            }
        } catch (e) {
            msg.channel.send(whError + "\n" + e);
            return;
        }
        if (wh == undefined) {
            msg.channel.send(whError);
            return;
        }
        for (let i = 0; i < newMsg.length && i !== 3 * Util.MESSAGE_MAX_LENGTH; i += Util.MESSAGE_MAX_LENGTH) {
            let msgAttachements: MessageAttachment[] = [];
            let embeds: MessageEmbed[] = [];
            if (i + Util.MESSAGE_MAX_LENGTH >= newMsg.length) {
                msg.attachments.each(a => {
                    msgAttachements.push(a);
                });
                embeds = msg.embeds;
                if (msg.reference !== null && msg.reference.messageId !== null) {
                    let reference = msg.channel.messages.cache.get(msg.reference.messageId);
                    if (reference === undefined) return;
                    embeds.unshift(new MessageEmbed()
                        .setTitle("En réponse à " + (msg.mentions.has(reference.author, { ignoreRoles: true, ignoreEveryone: true }) ? "@" : "")
                            + (reference.member?.nickname === null || reference.member?.nickname === undefined ? reference.author.username : reference.member?.nickname))
                        .setURL(reference.url)
                        .setColor("#4f545c"));
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
    });
}

function getServerMap(guildID: string): MapFile {
    let map = maps.get(guildID);
    if (map === undefined) {
        map = new MapFile(resolve(__dirname, "../maps", guildID));
        maps.set(guildID, map);
    }
    return map;
}

function getContent(commands: string[], index: number) {
    return commands.slice(index).join(" ");
}

client.on("ready", () => {
    if (!fs.existsSync(resolve(__dirname, "../maps"))) fs.mkdirSync(resolve(__dirname, "../maps"));
    console.log(`Ready as ${client.user?.tag} in ${client.guilds.cache.size} servers !`);
    let id = client.user?.id;
    assert(id !== undefined);
    botID = id;
});

client.on("messageCreate", (msg) => {
    if (msg.type !== "DEFAULT" && msg.type !== "REPLY") return;
    if (msg.author.bot) return;
    if (msg.guild === null) return;
    if (!(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel)) return;
    let botMember = msg.guild.members.cache.get(botID);
    assert(botMember !== undefined);
    if (!msg.channel.permissionsFor(botMember)?.has(Permissions.FLAGS.SEND_MESSAGES)) return;
    let map = getServerMap(msg.guild.id);
    if (!msg.content.startsWith(prefix) || !msg.member?.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
        verifyMsg(msg, map);
        return;
    }

    let commands = msg.content.slice(prefix.length).trim().split(/\s+/);
    if (commands[0] === "add") {
        //let usage = "usage : " + prefix + "add \"`search value`\" \"`replace value`\" `[priority (-2 to 2)]`";
        //const regex = /^\"\s*([^\n]+)\s*\"\s*\"\s*([^\n]+)\s*\"\s*([-+]?[0-2])?$/;
        let usage = "usage : " + prefix + "add \"`search value`\" \"`replace value`\"";
        const regex = /^\"\s*([^\n]+)\s*\"\s*\"\s*([^\n]+)\s*\"\s*$/;
        let content = getContent(commands, 1);
        let r = regex.exec(content)?.values();
        if (r === undefined) {
            msg.channel.send(usage);
            return;
        }
        r.next();
        let key: string = r.next().value;
        let value: string = r.next().value;
        //let priority = parseInt(r.next().value) + 2;
        map.set(
            MessageReplacer.normalizeKey(key).value,
            [value.trim()] //, String(Number.isNaN(priority) ? 2 : priority)]
        );
        msg.react("✅");
    } else if (commands[0] === "remove") {
        let usage = "usage : " + prefix + "remove \"`search value`\"";
        const regex = /^"\s*([^\n]+)\s*"\s*$/;
        let content = getContent(commands, 1);
        let r = regex.exec(content)?.values();
        if (r === undefined) {
            msg.channel.send(usage);
            return;
        }
        r.next();
        let key = MessageReplacer.normalizeKey(String(r.next().value)).value;
        if (map.delete(key)) {
            msg.react("✅");
        } else {
            msg.channel.send("La valeur " + key + " n'a pas été trouvé. Veuillez faire " + prefix + "list pour voir les valeurs possibles.");
        }
    } else if (commands[0] === "list" && commands.length === 1) {
        if (map.size() === 0) {
            msg.channel.send("Aucune association enregistré.");
            return;
        }
        let content = "";
        for (let key of map.keys()) {
            let value = map.get(key);
            assert(value !== undefined);
            let line = "`" + key + "` ➔ `" + value[0].replaceAll("`", "``") + "`";
            if (content.length + line.length + 1 >= Util.MESSAGE_MAX_LENGTH) {
                msg.channel.send(content);
                content = line;
            } else {
                content += "\n" + line;
            }
        }
        if (content.length !== 0) msg.channel.send(content);
    } else if (commands[0] === "help" && commands.length === 1) {
        msg.channel.send(
            prefix + "add \"`search value`\" \"`replace value`\"\n"
            + prefix + "remove \"`search value`\"\n"
            + prefix + "list\n"
        );
    } else {
        verifyMsg(msg, map);
    }
});

client.on("messageUpdate", (oldMsg, msg) => {
    if (msg.type !== "DEFAULT" && msg.type !== "REPLY") return;
    if (msg.author.bot) return;
    if (!(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel)) return;
    if (msg.guild === null) return;
    if (
        !msg.content.startsWith(prefix) ||
        !msg.member?.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)
    ) {
        let map = getServerMap(msg.guild.id);
        verifyMsg(msg, map);
        return;
    }
});

client.login(process.env.BOT_TOKEN);