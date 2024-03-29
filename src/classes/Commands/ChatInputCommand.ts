import { ApplicationCommandType, AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import Command from "./Command";

export default abstract class ChatInputCommand extends Command {
    getCommandType(): ApplicationCommandType {
        return ApplicationCommandType.ChatInput;
    };
    abstract execute(interaction: ChatInputCommandInteraction): void;
    getAutocompletions(interaction: AutocompleteInteraction): string[] {
        return [];
    };
}