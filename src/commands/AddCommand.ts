import * as assert from 'assert';
import { SlashCommandBuilder, ChatInputCommandInteraction, ApplicationCommandType } from "discord.js";
import ChatInputCommand from '../classes/ChatInputCommand';
import MapFile from '../classes/MapFile';
import MessageReplacer from '../classes/MessageReplacer';
import Util from '../classes/Util';

class AddCommand extends ChatInputCommand {
    private name = "add";
    private description = "Ajoutez une valeur qui doit se faire remplacer par une autre valeur";
    private searchValueField = "search";
    private replaceValueField = "replace_with";

    static readonly SEARCH_VALUE_MAX_LENGTH: number = 200;
    static readonly REPLACE_VALUE_MAX_LENGTH: number = 400;

    getName(): string {
        return this.name;
    }

    getCommandType(): ApplicationCommandType {
        return ApplicationCommandType.ChatInput;
    }

    getCommandBuilder(): Omit<SlashCommandBuilder, any> {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName(this.searchValueField)
                .setDescription("La valeur à remplacer")
                .setRequired(true)
                .setMaxLength(AddCommand.SEARCH_VALUE_MAX_LENGTH))
            .addStringOption(option =>
                option.setName(this.replaceValueField)
                .setDescription("La valeur qui remplacera la valeur à remplacé")
                .setRequired(true)
                .setMaxLength(AddCommand.REPLACE_VALUE_MAX_LENGTH))
            .setDMPermission(false)
            .setDefaultMemberPermissions('0');
    }
    
    execute(interaction: ChatInputCommandInteraction): void {
        assert(interaction.guild !== null);
        let map = Util.getServerMap(interaction.guild.id);
        let key: string = interaction.options.getString(this.searchValueField, true);
        let value: string = interaction.options.getString(this.replaceValueField, true);
        if (key.includes(MapFile.SPLITTER) || value.includes(MapFile.SPLITTER)) {
            interaction.reply(`Les valeurs ne peuvent pas contenir \"${MapFile.SPLITTER}\"`);
            return;
        }
        key = MessageReplacer.normalizeKey(key).value;
        if (map.get(key) !== undefined) {
            interaction.reply("Remplacement modifié. `" + key + "` ➔ `" + value.trim().replaceAll("`", "``") + "`");
        } else {
            interaction.reply("`" + key + "` ➔ `" + value.trim().replaceAll("`", "``") + "` ajouté.");
        }
        map.set(
            key,
            [value.trim()]
        );
    }
}

export default AddCommand;