import { ApplicationCommandType, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import Command from "./Command";

export default abstract class ChatInputSubCommand extends Command {
    getCommandType(): ApplicationCommandType {
        return ApplicationCommandType.ChatInput;
    };
    abstract execute(interaction: ChatInputCommandInteraction): void;
    abstract getCommandBuilder(): SlashCommandSubcommandBuilder;
}