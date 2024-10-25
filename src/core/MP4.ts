export interface IMP4Track {

    bitrate: number;
    codec: string;
    cts_shift: any;
    duration: number;
    id: number;
    movie_duration: number;
    movie_timescale: number;
    name: string;
    nb_samples: number;
    samples_duration: number;
    size: number;
    timescale: number;
    track_height: number;
    track_width: number;
    type: "audio" | "video" | "metadata";
    video: {width: number, height: number};
    audio: {
        channel_count: number;
        sample_rate: number;
        sample_size: number;
    }
    volume: number;

    finished?: boolean;

}

export interface IMP4Info {

    tracks: IMP4Track[];
    duration: number;
    isFragmented: boolean;
    isProgressive: boolean;
    mime: string;
    timescale: number;

}

export interface IMP4Sample {
    alreadyRead: number;
    chunk_index: number;
    chunk_run_index: number;
    cts: number;
    data: Uint8Array;
    degradation_priority: number;
    depends_on: number;
    description: {
        avcC: {
            type: string;
            size: number;
            uuid: any;
            start: number;
        },
        compressorname: string;
        channel_count: number;
        data_reference_index: number;
        depth: number;
        frame_count: number;
        hdr_size: number;
        height: number;
        horizresolution: number;
        samplerate: number;
        samplesize: number;
        size: number;
        start: number;
        type: string;
        uuid: any;
        vertresolution: number;
        width: number;
    }
    description_index: number;
    dts: number;
    duration: number;
    has_redundancy: number;
    is_depended_on: number;
    is_leading: number;
    is_sync: false;
    number: number;
    offset: number;
    size: number;
    timescale: number;
    track_id: number;
}