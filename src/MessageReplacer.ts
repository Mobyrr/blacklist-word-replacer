import MapFile from "./MapFile";

export default class MessageReplacer {
    //static readonly BLACKLIST_CHARACTERS = "\n\t,?;.:/!§*µù%^¨$£ø=+}])°@\\_|-[({'#\"~&";
    static readonly normalizerRegex = /\p{Diacritic}|[^ a-zA-Z\d]/gu;

    /**
     * @returns null if the message has not been changed, otherwise the transformed message
     */
    public static transformMessage(msg: string, map: MapFile): string | null {
        let newMsg = msg;
        let hasChanged = false;
        for (let key of map.keys()) {
            let nkey = key.replace(" ", "");
            let start = -1;
            let j = 0;
            let letter: string;
            let nData = MessageReplacer.normalizeKey(newMsg);
            for (let i = 0; i < nData.value.length; i++) {
                if (nData.value[i] === nkey[j]) {
                    if (start == -1) start = i;
                    letter = nkey[j];
                    while (nkey[j] === letter) j++;
                    while (nData.value[i + 1] === letter) i++;
                    if (j === nkey.length) {
                        let value = map.get(key);
                        if (value === undefined) throw "error";
                        newMsg =
                            newMsg.slice(0, nData.indexTab[start]) +
                            value +
                            newMsg.slice(nData.indexTab[i] + 1, newMsg.length);
                        nData = MessageReplacer.normalizeKey(newMsg);
                        i = start + value.length - 1;
                        if (!hasChanged) hasChanged = true;
                        start = -1;
                        j = 0;
                    }
                } else if (start > -1) { //the current letter does not match the current letter of the key
                    start = -1;
                    j = 0;
                    i--; // restart reading at the same letter
                    continue;
                }
            }
        }
        return hasChanged ? newMsg : null;
    }

    public static normalizeKey(key: string, removeSpaces: boolean = true): NormalizedKey {
        let indexTab: number[] = [];
        let result = "";
        let wasSpace = true;
        for (let i = 0; i < key.length; i++) {
            let newChar = key[i].normalize("NFD").replace(this.normalizerRegex, "");
            if (newChar === "") continue;
            if (newChar === " ") {
                if (removeSpaces) continue;
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