[![Action Status](https://github.com/web-atoms/media-converter/workflows/Build/badge.svg)](https://github.com/web-atoms/media-converter/actions) [![npm version](https://badge.fury.io/js/%40web-atoms%2Fcore.svg)](https://badge.fury.io/js/%40web-atoms%2Fcore)


# Media Convert
MP4 to WebM Converter in Browser using WebCodecs

1. WebCodecs provides faster media encoder/decoder.
2. Supports resizing video to lower file size by reudcing bit rate.
3. Supported on Chrome.

```html
<!DOCTYPE HTML>
<html>
    <head></head>
    <body>
        <div>Choose File</div>
        <input id="videoFile" type="file" accept="video/*">
        <progress min="0" max="1"></progress>
        <video controls="true" style="height: 500px"></video>
        <pre style="height: 400px; width: 100%"></pre>

        <script type="module">

            import { MediaConverter } from "https://cdn.jsdelivr.net/npm/@web-atoms/media-converter@1.0.4/dist/index.js"

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
        </script>
    </body>
</html>
```
