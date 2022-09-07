import AddCommand from "../commands/AddCommand";
import ListCommand from "../commands/ListCommand";
import PingCommand from "../commands/PingCommand";
import RemoveCommand from "../commands/RemoveCommand";
import Command from "./Command";

let botCommands: Command[] = [
	new PingCommand(),
	new ListCommand(),
	new AddCommand(),
	new RemoveCommand()
];

export default botCommands;