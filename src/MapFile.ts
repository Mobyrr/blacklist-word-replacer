import * as fs from "fs";

export default class MapFile {
    static readonly SPLITTER: string = "µ";

    private data: Map<String, String>;
    private path: string;

    constructor(path: string) {
        this.data = new Map<String, String>();
        this.path = path;
        this.fillDataFromFile();
    }

    private fillDataFromFile() {
        let data = fs.readFileSync(this.path, { flag: "a+" }).toString();
        let list = data.split("\n");
        for (let line of list) {
            if (line.trim() === "") continue;
            if (
                !line.includes(MapFile.SPLITTER) ||
                line.indexOf(MapFile.SPLITTER) !== line.lastIndexOf(MapFile.SPLITTER)
            ) {
                throw "the file is invalid";
            }
            let d = line.split(MapFile.SPLITTER);
            this.data.set(d[0], d[1]);
        }
    }

    public get(key: String) {
        return this.data.get(key);
    }

    public async set(key: String, value: String): Promise<void> {
        if (key.includes(MapFile.SPLITTER) || value.includes(MapFile.SPLITTER))
            throw "Key or value contain the splitter";
        if (!this.data.has(key)) {
            await fs.promises.appendFile(this.path, "\n" + key + MapFile.SPLITTER + value);
        } else {
            let data = (await fs.promises.readFile(this.path)).toString();
            let re = new RegExp("^" + key + MapFile.SPLITTER + ".*$", "gm");
            let formatted = data.replace(re, key + MapFile.SPLITTER + value);
            await fs.promises.writeFile(this.path, formatted);
        }

        this.data.set(key, value);
    }

    public async delete(key: String): Promise<boolean> {
        let result = this.data.delete(key);
        if (result) {
            let data = (await fs.promises.readFile(this.path)).toString();
            let formatted = data.replace(new RegExp("^" + key + MapFile.SPLITTER + ".*", "gm"), "");
            formatted = formatted.replace(new RegExp("^(?:[\t ]*(?:\r?\n|\r))+", "gm"), "");
            console.log(data);
            console.log(formatted);
            await fs.promises.writeFile(this.path, formatted);
        }
        return result;
    }

    public keys() {
        return this.data.keys();
    }
}
