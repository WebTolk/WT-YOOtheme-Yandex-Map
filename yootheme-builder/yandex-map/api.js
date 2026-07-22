function from(module, ...keys) {
    return Object.fromEntries(
        keys.map(key => [key, module[key]])
    );
}

export async function loadYandexApi({cdn = [], imports = {}}) {
    try {
        await ymaps3.ready;

        if (cdn.length > 0) {
            ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', cdn);
        }

        const importEntries = Object.entries(imports);
        const modules = await Promise.all(
            importEntries.map(([packageName]) => ymaps3.import(packageName))
        );

        return Object.assign(
            ymaps3,
            ...modules.map((module, index) => from(module, ...(importEntries[index][1] || [])))
        );
    } catch (e) {
        // console.error(e);
        // console.error('WT YOOtheme Yandex Map:', Joomla?.Text?._('PLG_WTYOOTHEMEYANDEXMAP_ERROR_API_KEY_NEEDED'));
        return null;
    }
}
