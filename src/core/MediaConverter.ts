import MP4Decoder from "./MP4Decoder.js";
import WebMEncoder from "./WebMEncoder.js";

export default class MediaConverter {

    async convert(file: File, { outputName, maxWidth, maxHeight, maxSize, onProgress, onLog = console.log }: {
        outputName: string,
        onProgress?: (x) => any,
        onLog?: (x) => any,
        maxWidth?: number,
        maxHeight?: number,
        maxSize?: number
    }) {

        const decoder = new MP4Decoder(file);


        const { duration, tracks } = await decoder.start();

        const audioTrack = tracks.find((x) => x.type === "audio");
        const videoTrack = tracks.find((x) => x.type === "video");

        let bitrate = 1_000_000; // roughly 2mb/s

        if (maxSize) {
            const durationInSeconds = duration / 1000;
            bitrate = Math.floor(6*maxSize / durationInSeconds);
            bitrate = Math.floor(bitrate / 1000)*1000;
            onLog?.(bitrate);
        }


        const video: VideoEncoderConfig = videoTrack ? {
            codec: "",
            width: videoTrack.video.width,
            height: videoTrack.video.height,
            bitrate,
            framerate: 24
        } : null;

        const audio: AudioEncoderConfig = audioTrack ? {
            codec: "",
            numberOfChannels: audioTrack.audio.channel_count,
            sampleRate: audioTrack.audio.sample_rate
        } : null;

       const total = (audioTrack?.nb_samples ?? 0) + (videoTrack?.nb_samples ?? 0);
        let progress = 0;


        if (video) {
            onLog?.({ output: { width: video.width, height: video.height }, bitrate})
            if (maxHeight) {
                if (video.height > maxHeight) {
                    video.width = maxHeight * video.width / video.height;
                    video.height = maxHeight;
                }
            }

            if (maxWidth) {
                if (video.width > maxWidth) {
                    video.height = maxWidth * video.height / video.width;
                    video.width = maxWidth;
                }
            }
        }

        const encoder = new WebMEncoder();
        await encoder.start({
            video,
            audio
        });

        for await (const { audio, video } of decoder.read()) {
            await encoder.queue({ audio, video });
            progress++;
            onProgress?.(progress/total);
        }

        return await encoder.done(outputName);

    }


}