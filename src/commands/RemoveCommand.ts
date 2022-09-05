import * as assert from 'assert';
import { SlashCommandBuilder, ChatInputCommandInteraction, ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import ChatInputCommand from '../classes/ChatInputCommand';
import MessageReplacer from '../classes/MessageReplacer';
import Util from '../classes/Util';

class RemoveCommand extends ChatInputCommand {
    private name = "remove";
    private description = "Supprimez une valeur à remplacer";
    private searchValueField = "search";

    getName(): string {
        return this.name;
    }

    getCommandType(): ApplicationCommandType {
        return ApplicationCommandType.ChatInput;
    }

    getRolePermissionsRequirement() {
        return PermissionFlagsBits.ManageMessages;
    }

    getCommandBuilder(): Omit<SlashCommandBuilder, any> {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName(this.searchValueField)
                .setDescription("La valeur qui ne doit plus être remplacé")
                .setRequired(true))
            .setDMPermission(false)
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
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

export = RemoveCommand;