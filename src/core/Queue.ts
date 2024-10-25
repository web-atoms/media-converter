
export default class Queue<T> {

    head = 0;
    tail = 0;

    get isEmpty() {
        return this.head === this.tail;
    }

    store: Map<any,any> = new Map();

    onDataAvailable = void 0;
    finished = false;

    peek() {
        return this.store.get(this.head);
    }

    public async waitForPeek() {
        if (this.isEmpty) {
            await new Promise<void>((resolve, reject)=> {
                this.onDataAvailable = resolve;

                setTimeout(() => {
                    resolve();
                }, 3000);
            });
            this.onDataAvailable = void 0;
        }
    }

    public enqueue(item: T) {
        // console.log(item);
        this.store.set(this.tail, item);
        this.tail++;
        this.onDataAvailable?.();
    }

    public dequeue() {
        const { head, tail } = this;
        const size = tail - head;
        if (size <= 0) {
            return void 0;
        }            
        const item = this.store.get(head);
        this.store.delete(head);
        this.head++;
        if (this.head === this.tail) {
            this.head = 0;
            this.tail = 0;
        }
        return item;
    }

}
