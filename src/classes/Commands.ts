import { readdirSync } from "fs";
import { join } from "path";
import Command from "./Command";

const botCommands: Command[] = [];
const commandsPath = join(__dirname, '../commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const command: Command = new (require(filePath))();
	botCommands.push(command);
}

export default botCommands;