document.addEventListener('DOMContentLoaded', () =>
{
    (function(w, a) {
        "use strict";
        async function C(elem, inputEl)
        {
            await ymaps3.ready;
            const {YMapZoomControl} = await ymaps3.import('@yandex/ymaps3-controls@0.0.1');
            const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');

            const yx = inputEl.value.split(',');
            const x = yx[1] ? yx[1] : 52;
            const y = yx[0] ? yx[0] : 52;

            const map = new ymaps3.YMap(elem, {
                location: {
                    center: [x, y],
                    zoom: 9
                },
                showScaleInCopyrights: true
            });
            map.addChild(new ymaps3.YMapDefaultSchemeLayer());
            map.addChild(new ymaps3.YMapDefaultFeaturesLayer());
            map.addChild(new ymaps3.YMapControls({position: 'right'})
                .addChild(new YMapZoomControl())
            );

            const draggableMarker = new YMapDefaultMarker({
                coordinates: [x, y],
                draggable: true,
                onDragEnd: (crds) =>
                {
                    map.update({location:{center:[crds[0].toFixed(6), crds[1].toFixed(6)],duration:400}});
                    inputEl.value = crds[1].toFixed(6) + ',' + crds[0].toFixed(6);
                    inputEl.dispatchEvent(new Event('input'));
                }
            });
            map.addChild(draggableMarker);
            map.addChild(new ymaps3.YMapListener({
                onClick: (obj, ev) =>
                {
                    draggableMarker.update({coordinates:[ev.coordinates[0].toFixed(6), ev.coordinates[1].toFixed(6)]});
                    map.update({location:{center:[ev.coordinates[0].toFixed(6), ev.coordinates[1].toFixed(6)],duration:400}});
                    inputEl.value = ev.coordinates[1].toFixed(6) + ',' + ev.coordinates[0].toFixed(6);
                    inputEl.dispatchEvent(new Event('input'));
                },
            }));
            inputEl.onchange = (ev) =>
            {
                const [new_y, new_x] = ev.target.value.split(',');
                if (isNaN(new_x) || isNaN(new_y))
                {
                    return;
                }
                draggableMarker.update({coordinates:[parseFloat(new_x).toFixed(6), parseFloat(new_y).toFixed(6)]});
                map.update({location:{center:[parseFloat(new_x).toFixed(6), parseFloat(new_y).toFixed(6)],duration:400}});
            };
        }

        w.component("Yandexmaplocation",
        {
            connected() {
                const mapContainer = document.createElement('div');
                mapContainer.style = "height: 260px";
                this.$el.insertAdjacentElement('beforebegin', mapContainer);
                C(mapContainer, this.$el);
            }
        })
    })(UIkit, UIkit.util);
});