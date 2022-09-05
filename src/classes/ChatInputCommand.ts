import { ChatInputCommandInteraction } from "discord.js";
import Command from "./Command";

export default abstract class ChatInputCommand extends Command {
    abstract execute(interaction: ChatInputCommandInteraction): void;
}