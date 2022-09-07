import { SlashCommandBuilder } from "discord.js";
import ChatInputCommandGroup from "../../classes/ChatInputCommandGroup";
import ChatInputSubCommand from "../../classes/ChatInputSubCommand";
import AddCommand from "./AddCommand";
import ListCommand from "./ListCommand";
import RemoveCommand from "./RemoveCommand";

class WordReplacerCommand extends ChatInputCommandGroup {
    private name = "wordreplacer";
    private description = "Gérez les mots à remplacer"

    getName(): string {
        return this.name;
    }

    getSubCommands(): ChatInputSubCommand[] {
        return [
            new AddCommand(),
            new RemoveCommand(),
            new ListCommand()
        ];
    }

    getCommandBuilder() {
        let scb = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .setDMPermission(false)
            .setDefaultMemberPermissions(0);
        for (let subCommand of this.getSubCommands()) {
            scb.addSubcommand(subCommand.getCommandBuilder());
        }
        return scb;
    }
}

export default WordReplacerCommand;