import { ApplicationCommandType } from "discord.js";
import ChatInputSubCommand from "./ChatInputSubCommand";
import Command from "./Command";

export default abstract class ChatInputCommandGroup extends Command {
    getCommandType(): ApplicationCommandType {
        return ApplicationCommandType.ChatInput;
    };
    abstract getSubCommands(): ChatInputSubCommand[];
}