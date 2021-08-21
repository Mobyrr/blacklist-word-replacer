import * as assert from "assert";
import MapFile from "./MapFile";

export default class MessageReplacer {
    static readonly normalizerRegex = /\p{Diacritic}|[^ a-zA-Z\d]/gu;

    /**
     * @returns null if the message has not been changed, otherwise the transformed message
     */
    public static transformMessage(msg: string, map: MapFile): string | null {
        let newMsg = msg;
        let data = MessageReplacer.normalizeKey(newMsg);
        let keys: KeyData[] = [];
        for (let i = 0; i < data.value.length; i++) {
            while (data.value[i] === " ") i++;
            for (let key of map.keys()) {
                let v = map.get(key);
                assert(v !== undefined);
                keys.push({ value: key, index: 0, start: i, valid: false, priority: 0 });
                //keys.push({ value: key, index: 0, start: i, valid: false, priority: parseInt(v[1]) });
            }
            let nextKeys: KeyData[] = [];
            let letter = data.value[i];
            while (data.value[i + 1] === letter) i++;
            for (let j = 0; j < keys.length; j++) {
                let key = keys[j];
                while (key.value[key.index] === " ") key.index++;
                if (data.value[i] === key.value[key.index]) {
                    nextKeys.push(key);
                    let letter = key.value[key.index];
                    while (key.value[key.index] === letter) key.index++;
                    if (key.index === key.value.length) {
                        key.valid = true;
                    }
                } else {
                    keys.splice(keys.indexOf(key), 1);
                    j--;
                }
            }
            let key = getValidKey(keys);
            if (key !== null) {
                let value = map.get(key.value);
                assert(value !== undefined);
                newMsg =
                    newMsg.slice(0, data.indexList[key.start]) + value[0]
                    + newMsg.slice(data.indexList[i] + 1, newMsg.length);
                data = MessageReplacer.normalizeKey(newMsg);
                i = key.start + MessageReplacer.normalizeKey(value[0]).value.length - 1;
                nextKeys = [];
            }
            keys = nextKeys;
        }
        return newMsg === msg ? null : newMsg;
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
        return { value: result, indexList: indexTab }
    }
}

interface NormalizedKey {
    value: string;
    indexList: number[];
}

interface KeyData {
    value: string;
    index: number;
    start: number;
    valid: boolean;
    priority: number;
};

function getValidKey(keys: KeyData[]): KeyData | null {
    if (keys.length === 0) return null;
    let bestKey: KeyData = keys[0];
    for (let i = 1; i < keys.length; i++) {
        if (keys[i].priority > bestKey.priority) {
            bestKey = keys[i];
        } else if (keys[i].valid && keys[i].priority >= bestKey.priority) {
            bestKey = keys[i];
        }
    }
    return bestKey.valid ? bestKey : null;
}