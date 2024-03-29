import * as assert from 'assert'
import { Client, ContextMenuCommandBuilder, REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from 'dotenv';
import { resolve } from "path";
import botCommands from './commands/Commands';

config({ path: resolve(__dirname, "../.env") });

const commands: (Omit<SlashCommandBuilder, any> | ContextMenuCommandBuilder)[] = [];

for (let cmd of botCommands) {
    commands.push(cmd.getCommandBuilder());
}

assert(process.env.BOT_TOKEN !== undefined);
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

const client = new Client({ intents: [] });

client.on("ready", () => {
    if (client.user === null) {
        console.log("No ClientUser found.");
        return;
    }
    console.log(`Connected as ${client.user.tag}, id: ${client.user.id}.`);
    rest.put(Routes.applicationCommands(client.user.id), { body: commands })
        .then(() => console.log(`Successfully registered ${commands.length} application commands.`))
        .catch(console.error);
    client.destroy();
});

client.login(process.env.BOT_TOKEN);