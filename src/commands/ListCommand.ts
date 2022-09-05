import * as assert from 'assert';
import { SlashCommandBuilder, ChatInputCommandInteraction, ApplicationCommandType } from "discord.js";
import ChatInputCommand from '../classes/ChatInputCommand';
import Util from '../classes/Util';

class ListCommand extends ChatInputCommand {
    private name = "list";
    private description = "Listez toutes les valeurs qui doivent se faire remplacer et leurs valeurs de remplacements";

    private andMoreMessage = "Et d'autres encore ... (pour l'instant impossible à visualiser)";

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
    }

    isServerOnlyCommand(): boolean {
        return true;
    }
    
    execute(interaction: ChatInputCommandInteraction): void {
        assert(interaction.guild !== null);
        let map = Util.getServerMap(interaction.guild.id);
        
        if (map.size() === 0) {
            interaction.reply("Aucune association enregistré.");
            return;
        }
        let content = "";
        for (let key of map.keys()) {
            let value = map.get(key);
            assert(value !== undefined);
            let line = "`" + key + "` ➔ `" + value[0].replaceAll("`", "``") + "`";
            if (content.length + line.length + this.andMoreMessage.length + 1 >= Util.MESSAGE_MAX_LENGTH) {
                interaction.reply(content + "\n" + this.andMoreMessage);
                return;
            } else {
                content += "\n" + line;
            }
        }
        interaction.reply(content);
    }
}

export = ListCommand;