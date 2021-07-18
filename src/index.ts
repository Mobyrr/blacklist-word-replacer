import * as fs from "fs";
import {
    Client,
    Message,
    Permissions,
    TextChannel,
    Webhook,
} from "discord.js";
import { resolve } from "path";
import MapFile from "./MapFile";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env") });

const client = new Client();
const prefix = "!";
let maps = new Map<string, MapFile>();

async function verifyMsg(msg: Message): Promise<void> {
    if (msg.guild === null) throw "Error";
    let map = maps.get(msg.guild.id);
    if (map === undefined) throw "Error";
    let newContent = msg.content;
    let hasChanged = false;
    for (let key of map.keys()) {
        let done = false;
        while (!done) {
            let start = -1;
            let j = 0;
            let letter = " ";
            for (let i = 0; i < newContent.length; i++) {
                if (newContent[i].toLowerCase() === key[j]) {
                    if (start == -1) start = i;
                    letter = key[j];
                    while (key[j] === letter || key[j] === " ") j++;
                    while (newContent[i + 1]?.toLowerCase() === letter) i++;
                    if (j == key.length) {
                        newContent =
                            newContent.slice(0, start) +
                            map.get(key) +
                            newContent.slice(i + 1, newContent.length);
                        if (!hasChanged) hasChanged = true;
                        break;
                    }
                } else if (
                    start > -1 &&
                    !" \n\t,?;.:/!§*µù%^¨$£ø=+}])°@\\_|-[({'#\"~&".includes(newContent[i])
                ) {
                    start = -1;
                    j = 0;
                    i--; // restart reading at the same letter
                    continue;
                }
                if (i == newContent.length - 1) {
                    done = true;
                    break;
                }
            }
        }
    }
    let botUser = msg.client.user;
    if (botUser == undefined) throw "Error";
    if (
        !(<TextChannel>msg.channel).members
            .get(botUser.id)
            ?.hasPermission(Permissions.FLAGS.MANAGE_WEBHOOKS)
    ) {
        msg.channel.send(
            "Remplacement du message précédent échoué car il me manque la permission de gérer les webhooks."
        );
        return;
    }
    if (
        !(<TextChannel>msg.channel).members
            .get(botUser.id)
            ?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES)
    ) {
        msg.channel.send(
            "Remplacement du message précédent échoué car il me manque la permission de gérer les messages."
        );
        return;
    }
    if (!hasChanged) return;
    let wh: Webhook | undefined;
    let whError = "Échec de la création/récupération du webhook, veuillez insulter Mobyr !";
    let nickname = msg.member?.nickname;
    nickname = nickname == null ? msg.author.username : nickname;
    let avatar = msg.author.avatarURL();
    try {
        wh = (await (<TextChannel>msg.channel).fetchWebhooks()).find((w) => w.name == nickname);
        if (wh == undefined) {
            wh = await (<TextChannel>msg.channel).createWebhook(nickname, {
                avatar: <string>avatar,
            });
        }
    } catch {
        msg.channel.send(whError);
        return;
    }
    if (wh == undefined) {
        msg.channel.send(whError);
        return;
    }
    await wh.send(newContent);
    wh.delete();
    msg.delete();
}

function getContent(commands: string[], index: number) {
    return commands.slice(index).join(" ");
}

client.on("ready", () => {
    if (!fs.existsSync("./maps")) fs.mkdirSync("./maps");
    console.log(`Ready as ${client.user?.tag} in ${client.guilds.cache.size} servers !`);
});

client.on("message", (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.type !== "text" || msg.guild == undefined) return;
    let map = maps.get(msg.guild.id);
    if (map === undefined) {
        map = new MapFile("maps/" + msg.guild.id);
        maps.set(msg.guild.id, map);
    }
    if (
        !msg.content.startsWith(prefix) ||
        !msg.member?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES)
    ) {
        verifyMsg(msg);
        return;
    }
    let commands = msg.content.slice(prefix.length).trim().split(/\s+/);
    if (commands[0] === "add") {
        let usage =
            "usage : `" +
            prefix +
            'add "search value" "replace value"`\nMust not contain the character `' +
            MapFile.SPLITTER +
            "`.";
        if (commands.length < 2) {
            msg.channel.send(usage);
            return;
        }
        const regex = /^"\s*([^µ]+)\s*"\s*"\s*([^µ]+)\s*"\s*$/;
        let content = getContent(commands, 1);
        let r = regex.exec(content)?.values();
        if (r === undefined) {
            msg.channel.send(usage);
            return;
        }
        r.next();
        map.set(String(r.next().value).trim(), String(r.next().value).trim());
        msg.react("✅");
    } else if (commands[0] === "remove" && commands.length > 1) {
        if (commands.length < 1) return;
    } else if (commands[0] === "list") {
        let x = 1;
        let content = "";
        let isEmpty = true;
        for (let key of map.keys()) {
            if (isEmpty) isEmpty = false;
            x++;
            content += "`" + key + "`" + " => " + "`" + map.get(key) + "`\n";
            if (x >= 15) {
                msg.channel.send(content);
                x = 1;
            }
        }
        if (x > 1) {
            msg.channel.send(content);
        } else if (isEmpty) {
            msg.channel.send("Aucune association enregistré.");
        }
    } else {
        verifyMsg(msg);
    }
});

client.on("messageUpdate", async (oldMsg, msg) => {
    if (msg.partial) msg = await msg.fetch();
    if (msg.author.bot) return;
    if (msg.channel.type !== "text" || msg.guild == undefined) return;
    if (
        !msg.content.startsWith(prefix) ||
        !msg.member?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES)
    ) {
        verifyMsg(msg);
        return;
    }
});

client.login(process.env.BOT_TOKEN);
