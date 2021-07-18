import {
    Client,
    Collection,
    Message,
    Permissions,
    ReactionUserManager,
    TextChannel,
    Webhook,
} from "discord.js";
import { resolve } from "path";
import MapFile from "./MapFile";
import { config } from "dotenv";
import { verify } from "crypto";

config({ path: resolve(__dirname, "../.env") });

const client = new Client();
const prefix = "!";
let map = new MapFile("./wordBlackListMap");

async function verifyMsg(msg: Message): Promise<void> {
    let content = msg.content;
    let hasChanged = false;
    for (let key of map.keys()) {
        let done = false;
        while (!done) {
            let start = -1;
            let j = 0;
            let letter = " ";
            for (let i = 0; i < content.length; i++) {
                if (content[i].toLowerCase() === key[j]) {
                    if (start == -1) start = i;
                    letter = key[j];
                    while (key[j] === letter || key[j] === " ") j++;
                    while (content[i + 1]?.toLowerCase() === letter) i++;
                    if (j == key.length) {
                        content = content.slice(0, start) + map.get(key) + content.slice(i + 1, content.length);
                        hasChanged = true;
                        break;
                    }
                } else if (start > -1 && !" \n\t,?;.:/!§*µù%^¨$£ø=+}])°@\\_|-[({'#\"~&".includes(content[i])) {
                    start = -1;
                }
                if (i == content.length - 1) {
                    done = true;
                    break;
                }
            }
        }
    }
    let botUser = msg.client.user;
    if (botUser == undefined) {
        console.log("wtf ??");
        return;
    }
    if (!(<TextChannel> msg.channel).members.get(botUser.id)?.hasPermission(Permissions.FLAGS.MANAGE_WEBHOOKS)) {
        msg.channel.send("Remplacement du message précédent échoué car il me manque la permission de gérer les webhooks.");
        return;
    }
    let wh : Webhook | undefined;
    let whError = "Échec de la création/récupération du webhook, veuillez insulter Mobyr !";
    try {
        if (!hasChanged) return;
        let nickname = msg.member?.nickname;
        nickname = nickname == null ? msg.author.username : nickname;
        let avatar = msg.author.avatarURL();
        wh = (await (<TextChannel> msg.channel).fetchWebhooks()).find(w => w.name == nickname);
        if (wh == undefined) {
            wh = await (<TextChannel> msg.channel).createWebhook(
                nickname, 
                {avatar: <string>avatar}
            );
        }
    } catch {
        msg.channel.send(whError);
        return;
    }
    if (wh == undefined) {
        msg.channel.send(whError);
        return;
    }
    await wh.send(content);
    wh.delete();
}

function getContent(commands: string[], index: number) {
    return commands.slice(index).join(" ");
}

client.on("ready", () => {
    console.log(
        `Ready as ${client.user?.tag} in ${client.guilds.cache.size} servers !`
    );
});

client.on("message", (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.type !== "text") return;
    if (!msg.content.startsWith(prefix) || !msg.member?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES)) {
        verifyMsg(msg);
        return;
    }
    let commands = msg.content
        .slice(prefix.length)
        .toLowerCase()
        .trim()
        .split(/\s+/);
    if (commands[0] === "add") {
        let usage =
            "usage : `" + prefix + 'add "search value" "replace value"`\nMust not contain the character `' + MapFile.SPLITTER + "`.";
        if (commands.length < 2) {
            msg.channel.send(usage);
            return;
        }
        const regex = /^"\s*([^µ]+)\s*"\s*"\s*([^µ]+)\s*"\s*$/;
        let content = getContent(commands, 1);
        let r = regex.exec(content)?.values();
        if (r == undefined) {
            msg.channel.send(usage);
            return;
        }
        r.next();
        map.set(String(r?.next().value).trim(), String(r?.next().value).trim());
        msg.react("✅");
    } else if (commands[0] === "remove" && commands.length > 1) {
        if (commands.length < 1) return;
    } else if (commands[0] === "list") {
        let x = 1;
        let content = "";
        for (let key of map.keys()) {
            x++;
            content += "`" + key + "`" + " => " + "`" + map.get(key) + "`\n";
            if (x >= 15) {
                msg.channel.send(content);
                x = 1;
            }
        }
        if (x > 1) {
            msg.channel.send(content);
        }
    } else {
        verifyMsg(msg);
    }
});

client.login(process.env.BOT_TOKEN);
