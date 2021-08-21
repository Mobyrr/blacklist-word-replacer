import * as fs from "fs";

export default class MapFile {
    static readonly SPLITTER: string = "µ";

    private data: Map<string, string[]>;
    private path: string;

    constructor(path: string) {
        this.data = new Map<string, string[]>();
        this.path = path;
        this.fillDataFromFile();
    }

    private fillDataFromFile(): void {
        let data = fs.readFileSync(this.path, { flag: "a+" }).toString();
        let list = data.split("\n");
        for (let line of list) {
            if (line.trim() === "") continue;
            if (!line.includes(MapFile.SPLITTER) ||
                line.indexOf(MapFile.SPLITTER) !== line.lastIndexOf(MapFile.SPLITTER)) {
                throw "the file is invalid";
            }
            let d = line.split(MapFile.SPLITTER);
            this.data.set(d[0], d.slice(1));
        }
    }

    public get(key: string): string[] | undefined {
        return this.data.get(key);
    }

    public set(key: string, value: string[]): void {
        if (key.includes(MapFile.SPLITTER) || key.includes("\n"))
            throw "The key contain the splitter or \\n";
        for (let v of value) {
            if (v.includes(MapFile.SPLITTER) || v.includes("\n"))
                throw "A value contain the splitter or \\n";
        }
        if (!this.data.has(key)) {
            fs.appendFileSync(this.path, "\n" + key + MapFile.SPLITTER + value);
        } else {
            let data = (fs.readFileSync(this.path)).toString();
            let re = new RegExp("^" + key + MapFile.SPLITTER + ".*$", "gm");
            let formatted = data.replace(re, key + MapFile.SPLITTER + value.join(MapFile.SPLITTER));
            fs.writeFileSync(this.path, formatted);
        }
        this.data.set(key, value);
    }

    public delete(key: string): boolean {
        let result = this.data.delete(key);
        if (result) {
            let data = fs.readFileSync(this.path).toString();
            let formatted = data.replace(new RegExp("^" + key + MapFile.SPLITTER + ".*", "gm"), "");
            formatted = formatted.replace(new RegExp("^(?:[\t ]*(?:\r?\n|\r))+", "gm"), "");
            fs.writeFileSync(this.path, formatted);
        }
        return result;
    }

    public keys() {
        return this.data.keys();
    }
}
