import * as assert from 'assert';
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import ChatInputCommand from '../classes/ChatInputCommand';
import MessageReplacer from '../classes/MessageReplacer';
import Util from '../classes/Util';
import AddCommand from './AddCommand';

class RemoveCommand extends ChatInputCommand {
    private name = "remove";
    private description = "Supprimez une valeur à remplacer";
    private searchValueField = "search";

    static readonly SEARCH_VALUE_MAX_LENGTH: number = AddCommand.SEARCH_VALUE_MAX_LENGTH;

    getName(): string {
        return this.name;
    }

    getCommandBuilder(): Omit<SlashCommandBuilder, any> {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName(this.searchValueField)
                .setDescription("La valeur qui ne doit plus être remplacé")
                .setRequired(true)
                .setMaxLength(RemoveCommand.SEARCH_VALUE_MAX_LENGTH))
            .setDMPermission(false)
            .setDefaultMemberPermissions('0');
    }
    
    execute(interaction: ChatInputCommandInteraction): void {
        assert(interaction.guild !== null);
        let map = Util.getServerMap(interaction.guild.id);
        let key: string = interaction.options.getString(this.searchValueField, true);
        key = MessageReplacer.normalizeKey(key).value;
        let value = map.get(key);
        if (value === undefined) {
            interaction.reply(key + " n'a pas été trouvé");
        } else {
            interaction.reply("`" + key + "` ➔ `" + value[0]?.trim().replaceAll("`", "``") + "` supprimé.");
        }
        map.delete(key);
    }
}

export default RemoveCommand;