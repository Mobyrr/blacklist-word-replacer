import { ApplicationCommandType, PermissionFlags, PermissionFlagsBits, PermissionResolvable, PermissionsBitField, SlashCommandBuilder } from "discord.js";

export default abstract class Command {
    abstract getName(): string;
    abstract getCommandType(): ApplicationCommandType;
    getRolePermissionsRequirement(): PermissionResolvable { return '0'; }
    abstract getCommandBuilder(): Omit<SlashCommandBuilder, any>;
}