import * as assert from 'assert';
import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import ChatInputSubCommand from '../../classes/Commands/ChatInputSubCommand';
import MessageReplacer from '../../classes/MessageReplacer';
import Util from '../../classes/Util';
import AddCommand from './AddCommand';

class RemoveCommand extends ChatInputSubCommand {
    private name = "remove";
    private description = "Supprimez une valeur à remplacer";
    private searchValueField = "search";

    static readonly SEARCH_VALUE_MAX_LENGTH: number = AddCommand.SEARCH_VALUE_MAX_LENGTH;

    getName() {
        return this.name;
    }

    getCommandBuilder() {
        return new SlashCommandSubcommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option => option.setName(this.searchValueField)
                .setDescription("La valeur qui ne doit plus être remplacé")
                .setRequired(true)
                .setMaxLength(RemoveCommand.SEARCH_VALUE_MAX_LENGTH)
                .setAutocomplete(true));
    }

    execute(interaction: ChatInputCommandInteraction) {
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

    getAutocompletions(interaction: AutocompleteInteraction) {
        assert(interaction.guild !== null);
        let map = Util.getServerMap(interaction.guild.id);
        let suggestions: string[] = [];
        for (let key of map.keys()) {
            if (key.startsWith(interaction.options.getFocused())) {
                suggestions.push(key);
                if (suggestions.length >= 25) break;
            }
        }
        return suggestions.sort();
    }
}

export default RemoveCommand;