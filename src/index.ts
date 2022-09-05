import * as fs from "fs";
import { ApplicationCommandType, Client, GatewayIntentBits, GuildMember, InteractionType, MessageType, PermissionFlagsBits, TextChannel, ThreadChannel } from "discord.js";
import { join, resolve } from "path";
import { config } from "dotenv";
import MessageReplacer from "./classes/MessageReplacer";
import SyncQueue from "./classes/SyncQueue";
import Util from "./classes/Util";
import Command from "./classes/Command";
import ChatInputCommand from "./classes/ChatInputCommand";

config({ path: resolve(__dirname, "../.env") });

const client = new Client({
    allowedMentions: { parse: [] },
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
let syncQueue = new SyncQueue();

function getContent(commands: string[], index: number) {
    return commands.slice(index).join(" ");
}

client.on("ready", () => {
    if (!fs.existsSync(resolve(__dirname, "../maps"))) fs.mkdirSync(resolve(__dirname, "../maps"));
    console.log(`Ready as ${client.user?.tag} in ${client.guilds.cache.size} servers !`);
});

client.on("messageCreate", (msg) => {
    syncQueue.add(async () => {
        if (msg.type !== MessageType.Default && msg.type !== MessageType.Reply) return;
        if (msg.author.bot) return;
        if (msg.guild === null) return;
        if (client.user === null) return;
        if (!(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel)) return;
        let botMember = msg.guild.members.cache.get(client.user.id);
        if (botMember === undefined) return;
        if (!msg.channel.permissionsFor(botMember)?.has(PermissionFlagsBits.SendMessages)) return;
        let map = Util.getServerMap(msg.guild.id);
        await MessageReplacer.replaceMsg(msg, map);
    });
});

client.on("messageUpdate", (_oldMsg, msg) => {
    syncQueue.add(async () => {
        if (msg.type !== MessageType.Default && msg.type !== MessageType.Reply) return;
        if (msg.author.bot) return;
        if (!(msg.channel instanceof TextChannel || msg.channel instanceof ThreadChannel)) return;
        if (msg.guild === null) return;
        let map = Util.getServerMap(msg.guild.id);
        await MessageReplacer.replaceMsg(msg, map);
    })
});

let commands: {name: string, type: ApplicationCommandType, command: Command}[] = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const command = require(filePath);
    const cmd: Command = new command();
	commands.push({name: cmd.getName(), type: cmd.getCommandType(), command: cmd});
}

client.on('interactionCreate', async interaction => {
	if (interaction.type !== InteractionType.ApplicationCommand || !interaction.isRepliable) return;
	let command = commands.find(o => o.name == interaction.commandName && o.type == interaction.commandType)?.command;
    
    if (command === undefined) {
        interaction.reply("Une erreur est survenue : la commande demandé n'est pas connu dans la version actuelle du bot.\n");
        return;
    }
    if (interaction.member !== null) {
        let member: GuildMember;
        if (interaction.member instanceof GuildMember) {
            member = interaction.member;
        } else {
            interaction.reply("Vos données de membre n'ont pas été trouvé.");
            return;
        }
        if (!member.permissions.has(command.getRolePermissionsRequirement())) {
            interaction.reply({content: `Vos permissions de rôles suivants sont manquants pour la commande demandé : ` 
                + Util.getMissingPermissionsMessage(member, null, command.getRolePermissionsRequirement()),
                ephemeral: true});
            return;
        }
    }
    if (interaction.commandType === ApplicationCommandType.ChatInput) {
        try {
            (command as ChatInputCommand).execute(interaction);
        } catch (error) {
            interaction.reply("La commande a rencontré une erreur.\n`" + error + "`");
            console.log(error);
        }
    } else {
        throw new Error('Not implemented.');
    }
});

client.login(process.env.BOT_TOKEN);