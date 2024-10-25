const modules = new Map<string, Promise<any>>();

const pendingModules = new Map<string, { resolve, reject, script }>();

(window as any).pendingModules = pendingModules;

export default class Modules {

    static async import<T = any>(name: string): Promise<T> {

        let m = modules.get(name);
        if (!m) {
            m = new Promise<any>((resolve, reject) => {

                const script = document.createElement("script");
                pendingModules.set(name, { resolve, reject, script });
                script.type = "module";
                script.textContent = `
                    import * as result from "${name}";
                    const { resolve, script } = window.pendingModules.get("${name}");
                    resolve(result);
                    script.remove();
                `;
                document.body.append(script);
            });
            modules.set(name, m);
        }
        return m;
    }

}
