import * as fs from "fs";
import { Client, Message, Permissions, TextChannel, ThreadChannel } from "discord.js";
import { resolve } from "path";
import MapFile from "./classes/MapFile";
import { config } from "dotenv";
import MessageReplacer from "./classes/MessageReplacer";
import SyncQueue from "./classes/SyncQueue";
import Util from "./classes/Util";
import * as assert from "assert";

config({ path: resolve(__dirname, "../.env") });

const client = new Client({
    allowedMentions: { parse: [] },
    intents: ['GUILDS', 'GUILD_MESSAGES']
});
const prefix = "!";
let maps = new Map<string, MapFile>();
// syncQueue need to be better implemented when arriving "/ commands"
let syncQueue = new SyncQueue();

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
});

client.on("messageCreate", (msg) => {
    syncQueue.add(async () => {
        if (msg.type !== "DEFAULT" && msg.type !== "REPLY") return;
        if (msg.author.bot) return;
        if (msg.guild === null) return;
        if (client.user === null) return;
        if (!(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel)) return;
        let botMember = msg.guild.members.cache.get(client.user.id);
        assert(botMember !== undefined);
        if (!msg.channel.permissionsFor(botMember)?.has(Permissions.FLAGS.SEND_MESSAGES)) return;
        let map = getServerMap(msg.guild.id);
        if (!msg.content.startsWith(prefix) || !msg.member?.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
            await MessageReplacer.replaceMsg(msg, map);
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
            await MessageReplacer.replaceMsg(msg, map);
        }
    });
});

client.on("messageUpdate", (_oldMsg, msg) => {
    syncQueue.add(async () => {
        if (msg.type !== "DEFAULT" && msg.type !== "REPLY") return;
        if (msg.author.bot) return;
        if (!(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel)) return;
        if (msg.guild === null) return;
        if (
            !msg.content.startsWith(prefix) ||
            !msg.member?.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)
        ) {
            let map = getServerMap(msg.guild.id);
            await MessageReplacer.replaceMsg(msg, map);
            return;
        }
    })
});

client.login(process.env.BOT_TOKEN);