export const ScriptInstaller = {

    install(src: string) {
        return new Promise<void>((resolve, reject) => {
            const s = document.createElement("script") as any;
            s.src = src;
            s.onload = s.onreadystatechange = () => {
                if ((s.readyState && s.readyState !== "complete" && s.readyState !== "loaded")) {
                    return;
                }
                s.onload = s.onreadystatechange = null;
                resolve();
            };
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }

}
