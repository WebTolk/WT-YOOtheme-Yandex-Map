import {loadYandexApi} from '../yandex-map/api.js';
import {parseCoordinates} from '../yandex-map/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    (function(w, a) {
        const DEFAULT_COORDINATES = [0, 0];

        async function getYandexApi() {
            return loadYandexApi({
                cdn: [
                    '@yandex/ymaps3-default-ui-theme@0.0.24'
                ],
                imports: {
                    '@yandex/ymaps3-markers@0.0.1': ['YMapDefaultMarker'],
                    '@yandex/ymaps3-default-ui-theme': ['YMapZoomControl']
                }
            });
        }

        async function build(elem, inputEl) {
            const ymaps3 = await getYandexApi();

            if (!ymaps3) {
                return;
            }

            const initialCoordinates = parseCoordinates(inputEl.value) || DEFAULT_COORDINATES;
            const [initialLat, initialLng] = initialCoordinates;

            const map = new ymaps3.YMap(elem, {
                location: {
                    center: [initialLng, initialLat],
                    zoom: 9
                },
                showScaleInCopyrights: true
            });
            map.addChild(new ymaps3.YMapDefaultSchemeLayer());
            map.addChild(new ymaps3.YMapDefaultFeaturesLayer());
            map.addChild(new ymaps3.YMapControls({position: 'right'})
                .addChild(new ymaps3.YMapZoomControl())
            );

            const draggableMarker = new ymaps3.YMapDefaultMarker({
                coordinates: [initialLng, initialLat],
                draggable: true,
                mapFollowsOnDrag: true,
                onDragStart: (a, b) => {
                    setMarkerCursor(draggableMarker, 'grabbing');
                },
                onDragEnd: (coords) => {
                    setMarkerCursor(draggableMarker, 'grab');

                    const lat = coords[1].toFixed(6);
                    const lng = coords[0].toFixed(6);

                    map.update({location: {center: [lng, lat], duration: 400}});
                    inputEl.value = lat + ',' + lng;
                    inputEl.dispatchEvent(new Event('input', {bubbles: true}));
                }
            });

            setMarkerCursor(draggableMarker, 'grab');

            map.addChild(draggableMarker);
            map.addChild(new ymaps3.YMapListener({
                onClick: (obj, ev) => {
                    const lat = ev.coordinates[1].toFixed(6);
                    const lng = ev.coordinates[0].toFixed(6);

                    draggableMarker.update({coordinates: [lng, lat]});
                    setMarkerCursor(draggableMarker, 'grab');

                    map.update({location: {center: [lng, lat], duration: 400}});
                    inputEl.value = lat + ',' + lng;
                    inputEl.dispatchEvent(new Event('input', {bubbles: true}));
                },
            }));
            inputEl.onchange = (ev) => {
                const newCoordinates = parseCoordinates(ev.target.value);
                if (!newCoordinates) {
                    return;
                }
                const [normalizedLat, normalizedLng] = newCoordinates;

                draggableMarker.update({coordinates: [normalizedLng, normalizedLat]});
                setMarkerCursor(draggableMarker, 'grab');

                map.update({location: {center: [normalizedLng, normalizedLat], duration: 400}});
            };
        }

        function setMarkerCursor(marker, cursorType) {
            marker._container.style.cursor = cursorType;
        }

        w.component("Yandexmaplocation", {
            connected() {
                const mapContainer = document.createElement('div');
                mapContainer.style = "height: 260px";
                this.$el.insertAdjacentElement('beforebegin', mapContainer);
                build(mapContainer, this.$el);
            }
        });
    })(UIkit, UIkit.util);
});
