import IEncodingConfig from "./IEncodingConfig.js";
import Modules from "./Modules.js";
import { waitForStart } from "./waitForStart.js";

export default class WebMEncoder {

    audioEncoder: AudioEncoder;
    videoEncoder: VideoEncoder;
    target: any;
    muxer: any;

    last: number;

    async start({ video , audio }: IEncodingConfig) {
        const { Muxer, ArrayBufferTarget } = await Modules.import("https://cdn.jsdelivr.net/npm/webm-muxer@5.0.2/build/webm-muxer.mjs");

        const target = new ArrayBufferTarget();

        const webmVideo = video ? { ... video } : void 0;
        const webmAudio = audio ? { ... audio } : void 0;

        const init = [];

        this.target = target;
        
        if (video) {
            video.codec ||= "vp8";
            webmVideo.codec = "V_" + video.codec.toUpperCase();
            const videoEncoder = new VideoEncoder({
                output: (chunk, meta) => this.muxer.addVideoChunk(chunk, meta),
                error: console.error
            });
            videoEncoder.configure(video);
            this.videoEncoder = videoEncoder;
            init.push(waitForStart(videoEncoder));
        }

        if (audio) {
            audio.codec ||= "opus";
            audio.bitrate ||= 64000;
            webmAudio.codec = "A_" + audio.codec.toUpperCase();
            const audioEncoder = new AudioEncoder({
                output: (chunk, meta) => this.muxer.addAudioChunk(chunk, meta),
                error: console.error
            });

            audioEncoder.configure(audio);
            this.audioEncoder = audioEncoder;
            init.push(waitForStart(audioEncoder));
        }

        await Promise.all(init);

        this.muxer = new Muxer({
            target,
            type: "webm",
            video: webmVideo,
            audio: webmAudio,
            firstTimestampBehavior: "permissive"
        });

    }

    async queue({ audio, video }: { audio: AudioData, video: VideoFrame }) {
        if (audio) {
            this.audioEncoder.encode(audio);
            audio.close();

            // wait till all frames are processed...
            return this.audioEncoder.flush();
        }
        if (video) {

            let keyFrame = false;
            if (!this.last) {
                keyFrame = true;
                this.last = video.timestamp;
            } else {
                keyFrame = (video.timestamp - this.last) >= 1000000;
                if (keyFrame) {
                    this.last = video.timestamp;
                }
            }

            this.videoEncoder.encode(video, { keyFrame });
            video.close();

            return this.videoEncoder.flush();
        }
    }

    async done(fileName: string, type: string = "video/webm") {
        await this.videoEncoder?.flush();
        await this.audioEncoder?.flush();

        this.videoEncoder?.close();
        this.audioEncoder?.close();

        this.muxer.finalize();

        const { buffer } = this.muxer.target;

        return new File([buffer], fileName, { type });
    }

}