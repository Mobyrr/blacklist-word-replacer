import * as assert from 'assert';
import { SlashCommandBuilder, ChatInputCommandInteraction, ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import ChatInputCommand from '../classes/ChatInputCommand';
import Util from '../classes/Util';

class ListCommand extends ChatInputCommand {
    private name = "list";
    private description = "Listez toutes les valeurs qui doivent se faire remplacer et leurs valeurs de remplacements";

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
            .setDMPermission(false)
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
    }
    
    execute(interaction: ChatInputCommandInteraction) {
        assert(interaction.guild !== null && interaction.channel !== null);
        let map = Util.getServerMap(interaction.guild.id);
        if (map.size() === 0) {
            interaction.reply("Aucune association enregistré.");
            return;
        }
        let content = "";
        let firstMessage = true;
        for (let key of map.keys()) {
            let value = map.get(key);
            assert(value !== undefined);
            let line = "`" + key + "` ➔ `" + value[0].replaceAll("`", "``") + "`";
            if (content.length + line.length >= Util.MESSAGE_MAX_LENGTH) {
                firstMessage ? interaction.reply(content) : interaction.channel.send(content);
                firstMessage = false;
                content = "";
            } else {
                content += "\n" + line;
            }
        }
        if (content !== "") firstMessage ? interaction.reply(content) : interaction.channel.send(content);
    }
}

export = ListCommand;