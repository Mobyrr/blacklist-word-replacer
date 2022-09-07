import { ApplicationCommandType, ContextMenuCommandType, MessageContextMenuCommandInteraction } from "discord.js";
import Command from "./Command";

export default abstract class MessageContextMenuCommand extends Command {
    getCommandType(): ContextMenuCommandType {
        return ApplicationCommandType.Message;
    };
    abstract execute(interaction: MessageContextMenuCommandInteraction): void;
}