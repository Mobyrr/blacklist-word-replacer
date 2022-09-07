import { SlashCommandSubcommandBuilder } from "discord.js";
import ChatInputCommand from "./ChatInputCommand";

export default abstract class ChatInputSubCommand extends ChatInputCommand {
    abstract getCommandBuilder(): SlashCommandSubcommandBuilder;
}