export const waitForStart = (av: AudioEncoder | VideoEncoder | AudioDecoder | VideoDecoder) => {

    return new Promise<void>((resolve, reject) => {

        const timer = setInterval(() => {
            if (av.state === "configured") {
                clearTimeout(timeout);
                clearInterval(timer);
                console.log(av);
                resolve();
            }
        }, 500);

        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            clearInterval(timer);
            console.log(`Failed to open `, av);
            reject(new Error("Timed out"));
        }, 5000);

    });

};
