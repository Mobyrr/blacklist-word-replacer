export default class SyncQueue {
    private queue : (() => Promise<unknown>)[] = [];
    private running : boolean = false;

    public add(callback : () => Promise<unknown>) {
        this.queue.push(callback);
        if (!this.running) {
            this.running = true;
            this.run();
        }
    }

    private async run() {
        while (this.running) {
            let f = this.queue.shift();
            if (f !== undefined) {
                await f();
            } else {
                this.running = false;
            }
        }
    }
}