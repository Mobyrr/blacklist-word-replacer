import * as assert from 'assert'
import { SlashCommandBuilder, Interaction, CacheType, InteractionType, ApplicationCommandType } from "discord.js";
import ChatInputCommand from '../classes/ChatInputCommand';

class PingCommand extends ChatInputCommand {
    private name = "ping";
    private description = "Testez si le bot est opérationnel"

    getName(): string {
        return this.name;
    }

    getCommandType(): ApplicationCommandType {
        return ApplicationCommandType.ChatInput;
    }

    getCommandBuilder(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description);
    }
    
    execute(interaction: Interaction<CacheType>): void {
        assert(interaction.type === InteractionType.ApplicationCommand);
        interaction.type
        if (!interaction.isRepliable) return;
        interaction.reply("Pong !");
    }
}

export = PingCommand;