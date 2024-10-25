import { MediaConverter } from "./dist/index.js"


const progress = document.body.querySelector("progress");

const pre = document.body.querySelector("pre");

const input = document.body.querySelector("input");

const video = document.body.querySelector("video");

progress.style.display = "none";


input.onchange = () => {
    convertFile(input.files[0]).catch((error) => {
        pre.append(document.createTextNode((error.stack ?? stack) + "\n"));
    })
};

async function convertFile(file) {
    progress.style.removeProperty("display");
    const mc = new MediaConverter();
    const output = await mc.convert(file, {
        outputName: file.name + ".webm",
        maxHeight: 720,
        maxSize: 25*1024*1024,
        onProgress: (x) => progress.value = x
    });

    const url = URL.createObjectURL(output);
    video.src = url;
    progress.style.display = "none";
}