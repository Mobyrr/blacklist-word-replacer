import * as assert from 'assert'
import { Client, REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from 'dotenv';
import { readdirSync } from "fs";
import { join, resolve } from "path";
import Command from "./classes/Command";

config({ path: resolve(__dirname, "../.env") });

const commands: Omit<SlashCommandBuilder, any>[] = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const command: Command = new (require(filePath))();
	commands.push(command.getCommandBuilder());
}

assert(process.env.BOT_TOKEN !== undefined);
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

const client = new Client({intents: []});

client.on("ready", () => {
    let clientId = client.user?.id;
    if (clientId === undefined) {
        console.log("No client ID found.");
        return;
    }
    console.log(`Connected as ${client.user?.tag}, id: ${client.user?.id}.`);
    rest.put(Routes.applicationCommands(clientId), { body: commands })
	    .then(() => console.log('Successfully registered application commands.'))
	    .catch(console.error);
    client.destroy();
});

client.login(process.env.BOT_TOKEN);