import * as fs from "fs";
import { ApplicationCommandType, ChannelType, Client, GatewayIntentBits, InteractionType, Message, MessageType, PermissionFlagsBits } from "discord.js";
import { resolve } from "path";
import { config } from "dotenv";
import MessageReplacer from "./classes/MessageReplacer";
import SyncQueue from "./classes/SyncQueue";
import Util from "./classes/Util";
import ChatInputCommand from "./classes/ChatInputCommand";
import botCommands from "./classes/Commands";
import MessageContextMenuCommand from "./classes/MessageContextMenuCommand";

config({ path: resolve(__dirname, "../.env") });

const client = new Client({
    allowedMentions: { parse: [] },
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let syncQueue = new SyncQueue();

client.on("ready", () => {
    if (!fs.existsSync(resolve(__dirname, "../maps"))) fs.mkdirSync(resolve(__dirname, "../maps"));
    console.log(`Ready as ${client.user?.tag} in ${client.guilds.cache.size} servers !`);
});

function replaceMsg(msg: Message) {
    syncQueue.add(async () => {
        if (msg.channel.type !== ChannelType.GuildText && msg.channel.type !== ChannelType.GuildPublicThread) return;
        if (msg.type !== MessageType.Default && msg.type !== MessageType.Reply) return;
        if (msg.author.bot) return;
        if (msg.guild === null) return;
        if (client.user === null) return;
        let botMember = msg.guild.members.cache.get(client.user.id);
        if (botMember === undefined) return;
        if (!msg.channel.permissionsFor(botMember)?.has(PermissionFlagsBits.SendMessages)) return;
        let map = Util.getServerMap(msg.guild.id);
        await MessageReplacer.replaceMsg(msg, map);
    });
}

client.on("messageCreate", (msg) => {
    replaceMsg(msg);
});

client.on("messageUpdate", (_oldMsg, msg) => {
    if (msg.partial) return; // isn't enabled
    replaceMsg(msg);
});

client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ApplicationCommand || !interaction.isRepliable) return;
    let command = botCommands.find(c => c.getName() == interaction.commandName && c.getCommandType() == interaction.commandType);
    if (command === undefined) {
        interaction.reply("Une erreur est survenue : la commande demandé n'est pas connu dans la version actuelle du bot.\n");
        return;
    }
    try {
        if (interaction.commandType === ApplicationCommandType.ChatInput) {
            (command as ChatInputCommand).execute(interaction);
        } else if (interaction.commandType == ApplicationCommandType.Message) {
            (command as MessageContextMenuCommand).execute(interaction);
        } else {
            throw new Error('Not implemented.');
        }
    } catch (error) {
        interaction.reply("La commande a rencontré une erreur.\n`" + error + "`");
        console.log(error);
    }
});

client.login(process.env.BOT_TOKEN);