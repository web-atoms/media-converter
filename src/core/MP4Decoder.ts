import { IMP4Info, IMP4Sample } from "./MP4.js";
import Queue from "./Queue.js";
import AVDecoder from "./AVDecoder.js";
import { ScriptInstaller } from "./ScriptInstaller.js";

declare let MP4Box;
declare let DataStream;

export default class MP4Decoder {

    lastError: any;

    ready: Promise<IMP4Info>;

    mp4Box: any;

    // queue = new Queue<{ track_id, ref, samples }>();

    frames = new Queue<{ audio?, video? }>();

    private info: IMP4Info;

    decoders: Map<any, AVDecoder> = new Map();

    constructor(private file: File) {

        console.log(this);
    }

    get isClosed() {
        for (const element of this.decoders.values()) {
            if(element.state !== "closed") {
                return false;
            }
        }
        return true;
    }

    async *read(): AsyncIterable<{ audio?: AudioData, video?: VideoFrame }> {
        console.log(this.frames);
        do {
            await this.frames.waitForPeek();
            let hasData = false;
            while(!this.frames.isEmpty) {
                yield this.frames.dequeue();
                hasData = true;
            }
            if (hasData){
                continue;
            }
            if (this.isClosed) {
                break;
            }
        } while(true);
    }

    async start() {

        await ScriptInstaller.install("https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js")
                
        const mp4Box = MP4Box.createFile();
        this.mp4Box = mp4Box;
        mp4Box.onError = (lastError) => this.lastError = lastError;

        const { decoders } = this;

        this.ready = new Promise((resolve, reject) => {
            mp4Box.onReady = (info: IMP4Info) => {
                console.log(info);
                console.log(mp4Box);
                this.info = info;
                // start reading...
                for (const track of info.tracks) {
                    switch(track.type) {
                        case "audio":
                            const audioDesc = this.getAudioDesc();
                            const ad = new AVDecoder(this.frames, {
                                type: "audio",
                                config: {
                                    codec: track.codec,
                                    sampleRate: track.audio.sample_rate,
                                    numberOfChannels: track.audio.channel_count,
                                    description: audioDesc
                                }
                            })
                            decoders.set(track.id, ad);
                            break;
                        case "video":
                            const description = this.getVideoDesc();
                            const vd = new AVDecoder(this.frames, {
                                type: "video",
                                config: {
                                    codec: track.codec.startsWith("vp08") ? "vp8" : track.codec,
                                    codedHeight: track.track_height,
                                    codedWidth: track.track_width,
                                    description
                                }
                            });
                            decoders.set(track.id, vd);
                            break;
                    }
                    mp4Box.setExtractionOptions(track.id, void 0, { nbSamples: 100 });
                }
                mp4Box.start();
                resolve(info);
            };
        });

        mp4Box.onSamples = (track_id, ref, samples: IMP4Sample[]) => {
            
            const last = samples[samples.length-1].number;
            const track = this.info.tracks.find((x) => x.id === track_id);

            const d = this.decoders.get(track_id);
            switch(track.type) {
                case "video":
                    for (const element of samples) {
                        const type = element.is_sync ? "key" : "delta";
                        const timestamp = (element.cts * 1000000) / element.timescale;
                        const duration = (element.duration * 1000000) / element.timescale;
                        d.decode(new EncodedVideoChunk({
                            data: element.data,
                            timestamp,
                            duration,
                            type
                        }));
                    }
                    break;
                case "audio":
                    for (const element of samples) {
                        const type = element.is_sync ? "key" : "delta";
                        const timestamp = (element.cts * 1000000) / element.timescale;
                        const duration = (element.duration * 1000000) / element.timescale;
                        d.decode(new EncodedAudioChunk({
                            data: element.data,
                            timestamp,
                            duration,
                            type
                        }));
                    }
                    break;
            }

            if (track.nb_samples === last+1) {
                // this track is finished...
                track.finished = true;
                d.flush().then(() => d.close());
            }

            // if (this.info.tracks.some((x) => !x.finished)) {
            //     return;
            // }

            // d.flush().then(() => d.close());

            // for (const element of this.decoders.values()) {
            //     element?.flush().then(() => {
            //         element.close();
            //         console.log(element);
            //     });
            // }
        };
       
        setTimeout(() => this.beginRead().catch(console.error));
        const r = await this.ready;

        return r;
    }

    getAudioDesc() {
        for (const trak of this.mp4Box.moov.traks) {
            const { stsd } = trak.mdia.minf.stbl;
            for (const entry of stsd.entries) {
                const { esds } = entry;
                if (esds) {
                    const { descs } = esds.esd;

                    for (const desc of descs) {
                        if(desc.tag === 0x04 && desc.oti === 0x40) {
                            return desc.data;
                        }
                    }
                }
            }
        }
    }

    getVideoDesc() {
        for (const trak of this.mp4Box.moov.traks) {
            const { stsd } = trak.mdia.minf.stbl;
            for (const entry of stsd.entries) {
                const videoBox = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
                if (!videoBox) {
                    continue;
                }
                const videoDesc = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
                videoBox.write(videoDesc);
                const description = new Uint8Array(videoDesc.buffer, 8);
                return description;
            }
        }
    }

    async beginRead() {
        const reader = this.file.stream().getReader();
        let offset = 0;
        do {

            const { done, value: { buffer} = {} } = await reader.read();

            if (done) {
                this.mp4Box.flush();
                break;
            }
            (buffer as any).fileStart = offset;
            offset += buffer.byteLength;
            this.mp4Box.appendBuffer(buffer);

        } while (true);
    }


}