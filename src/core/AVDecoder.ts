import Queue from "./Queue.js";
import { waitForStart } from "./waitForStart.js";

export default class AVDecoder {

    public readonly ready: Promise<void>;

    private readonly decoder: AudioDecoder | VideoDecoder;

    get state() {
        return this.decoder.state;
    }

    constructor(
        private readonly frames: Queue<{ audio?, video? }>,
        { type, config }: { type: "audio", config: AudioDecoderConfig } | { type: "video", config: VideoDecoderConfig}
    ) {

        switch(type) {
            case "audio":
                const ad = this.decoder = new AudioDecoder({
                    error: console.error,
                    output: (audio) => this.frames.enqueue({ audio })
                });
                ad.configure(config);
                break;
            case "video":
                const vd = this.decoder = new VideoDecoder({
                    error: console.error,
                    output: (video) => this.frames.enqueue({ video })
                });
                vd.configure(config);
                break;
            default:
                throw new Error("Not supported");
        }

        this.ready = waitForStart(this.decoder);
    }

    decode(chunk: EncodedAudioChunk | EncodedVideoChunk) {
        this.ready.then(() => {
            this.decoder.decode(chunk);
            Object.defineProperty(this, "decode", {
                configurable: true,
                enumerable: true,
                value: (c) => this.decoder.decode(c)
            });
        });
    }

    async flush() {
        await this.ready;
        return this.decoder.flush();
    }

    close() {
        this.decoder.close();
    }

}