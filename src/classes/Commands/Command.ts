import { ApplicationCommandType, ContextMenuCommandBuilder, SlashCommandBuilder } from "discord.js";

export default abstract class Command {
    abstract getName(): string;
    abstract getCommandType(): ApplicationCommandType;
    abstract getCommandBuilder(): Omit<SlashCommandBuilder, any> | ContextMenuCommandBuilder;
}