document.addEventListener('DOMContentLoaded', () => {
    (function(w, a) {
        "use strict";
        async function C(elem, yandexmapProps)
        {
            await ymaps3.ready;
            const {YMapZoomControl} = await ymaps3.import('@yandex/ymaps3-controls@0.0.1');
            const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');

            const isZoomEnable = yandexmapProps['zooming'] === true;
            const cfg = {
                location: {
                    center: [yandexmapProps['center_x'], yandexmapProps['center_y']],
                    zoom: yandexmapProps['zoom'],
                },
                showScaleInCopyrights: true,
                behaviors: []
            };

            if (yandexmapProps['dragging'] === true)
            {
                cfg.behaviors.push('drag');
            }

            if (isZoomEnable)
            {
                cfg.behaviors.push('scrollZoom', 'pinchZoom');
            }

            if (isZoomEnable)
            {
                cfg.zoomRange = {
                    min: parseInt(yandexmapProps['min_zoom']),
                    max: parseInt(yandexmapProps['max_zoom'])
                };
            }

            const map = new ymaps3.YMap(elem, cfg);
            switch (yandexmapProps['type']) {
                case 'satellite':
                    map.addChild(new ymaps3.YMapDefaultSatelliteLayer());
                    break;
                case 'scheme':
                default:
                    map.addChild(new ymaps3.YMapDefaultSchemeLayer({
                        theme: yandexmapProps['text_color']
                    }));
                    break;
            }
            map.addChild(new ymaps3.YMapDefaultFeaturesLayer());
            if (isZoomEnable)
            {
                map.addChild(new ymaps3.YMapControls({position: 'right'})
                    .addChild(new YMapZoomControl())
                );
            }

            if (yandexmapProps['markers'])
            {
                for (const markerData of yandexmapProps['markers'])
                {
                    const coords = markerData['location'].split(',');
                    const markerCfg = {
                        title: markerData['title'],
                        coordinates: [parseFloat(coords[1]), parseFloat(coords[0])]
                    };
                    // do not show popup if content is empty
                    if (markerData['content'])
                    {
                        markerCfg.popup = { content: markerData['content'], position: 'left' };
                    }
                    markerCfg.onClick = (ev) =>
                    {
                        map.update({
                            location: {
                                center: [parseFloat(coords[1]), parseFloat(coords[0])],
                                duration: 400,
                                zoom: yandexmapProps['zoom']
                            }
                        });
                    };
                    const marker = new YMapDefaultMarker(markerCfg);
                    map.addChild(marker);
                }
            }
        }

        w.component("Yandexmap", {
            connected() {
                if (this.script || (this.script = a.$("script", this.$el)),
                    !this.script)
                    return;
                const yandexmapProps = JSON.parse(this.script.textContent);
                C(this.$el, yandexmapProps);
            }
        })
    })(UIkit, UIkit.util);
});