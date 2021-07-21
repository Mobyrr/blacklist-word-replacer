import MapFile from "./MapFile";

export default class MessageReplacer {
    //static readonly BLACKLIST_CHARACTERS = "\n\t,?;.:/!§*µù%^¨$£ø=+}])°@\\_|-[({'#\"~&";
    static readonly normalizerRegex = /\p{Diacritic}|[^ a-zA-Z\d]/gu;

    /**
     * @returns null if the message has not been changed, otherwise the transformed message
     */
    public static transformMessage(msg: string, map: MapFile): string | null {
        let newMsg = msg;
        let data = MessageReplacer.normalizeKey(newMsg);
        let keys: { value: string, index: number, start: number }[] = [];
        for (let i = 0; i < data.value.length; i++) {
            while (data.value[i] === " ") i++;
            for (let key of map.keys()) {
                keys.push({ value: key, index: 0, start: i });
            }
            let newKeys: { value: string, index: number, start: number }[] = [];
            let letter = data.value[i];
            while (data.value[i + 1] === letter) i++;
            for (let j = 0; j < keys.length; j++) {
                let key = keys[j];
                while (key.value[key.index] === " ") key.index++;
                if (data.value[i] === key.value[key.index]) {
                    newKeys.push(key);
                    let letter = key.value[key.index];
                    while (key.value[key.index] === letter) key.index++;
                    if (key.index === key.value.length) {
                        let value = map.get(key.value);
                        if (value === undefined) throw "error";
                        newMsg =
                            newMsg.slice(0, data.indexTab[key.start]) + value
                            + newMsg.slice(data.indexTab[i] + 1, newMsg.length);
                        data = MessageReplacer.normalizeKey(newMsg);
                        i = key.start + MessageReplacer.normalizeKey(value).value.length - 1;
                        newKeys = [];
                        j = keys.length;
                    }
                } else { //the current letter does not match the current letter of the key
                    keys.splice(keys.indexOf(key), 1);
                    j--;
                }
            }
            keys = newKeys;
        }
        return newMsg.toLowerCase() === msg.toLowerCase() ? null : newMsg;
    }

    public static normalizeKey(key: string): NormalizedKey {
        let indexTab: number[] = [];
        let result = "";
        let wasSpace = true;
        for (let i = 0; i < key.length; i++) {
            let newChar = key[i].normalize("NFD").replace(this.normalizerRegex, "");
            if (newChar === "") continue;
            if (newChar === " ") {
                if (wasSpace) continue;
                wasSpace = true;
            } else {
                wasSpace = false;
            }
            result += newChar.toLowerCase();
            indexTab.push(i);
        }
        if (result[result.length - 1] === " ") {
            result = result.slice(0, result.length - 1);
            indexTab.pop();
        }
        return { value: result, indexTab: indexTab }
    }
}

interface NormalizedKey {
    value: string;
    indexTab: number[];
}