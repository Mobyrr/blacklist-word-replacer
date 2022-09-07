import PingCommand from "./PingCommand";
import Command from "../classes/Commands/Command";
import MessageReplacerCommand from "./MessageReplacerCommand/MessageReplacerCommand";

let botCommands: Command[] = [
	new PingCommand(),
	new MessageReplacerCommand()
];

export default botCommands;