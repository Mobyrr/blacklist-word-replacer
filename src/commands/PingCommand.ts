import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import ChatInputCommand from '../classes/ChatInputCommand';

class PingCommand extends ChatInputCommand {
    private name = "ping";
    private description = "Testez si le bot est opérationnel"

    getName(): string {
        return this.name;
    }

    getCommandBuilder(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description);
    }
    
    execute(interaction: ChatInputCommandInteraction): void {
        interaction.reply("Pong !");
    }
}

export default PingCommand;