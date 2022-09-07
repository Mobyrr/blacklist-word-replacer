import * as assert from 'assert';
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import ChatInputSubCommand from '../../classes/Commands/ChatInputSubCommand';
import Util from '../../classes/Util';

class ListCommand extends ChatInputSubCommand {
    private name = "list";
    private description = "Listez toutes les valeurs qui doivent se faire remplacer et leurs valeurs de remplacements";

    getName() {
        return this.name;
    }

    getCommandBuilder() {
        return new SlashCommandSubcommandBuilder()
            .setName(this.name)
            .setDescription(this.description);
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

export default ListCommand;