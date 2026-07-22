import * as clusterModule from './cluster.js';
import * as utilsModule from './utils.js';
import * as controlsModule from './controls.js';
import {createCustomMarker} from './customMarker.js';
import {loadYandexApi} from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    (function(w, a) {
        const CLUSTER_ANIMATION = {
            easing: 'ease-in-out',
            duration: 250
        };
        const MARKER_ANIMATION = {
            easing: 'ease-in-out',
            duration: 400
        };

        async function getYandexApi() {
            return loadYandexApi({
                cdn: [
                    '@yandex/ymaps3-default-ui-theme@0.0.24',
                    '@yandex/ymaps3-clusterer@0.0.12'
                ],
                imports: {
                    '@yandex/ymaps3-markers@0.0.1': ['YMapDefaultMarker'],
                    '@yandex/ymaps3-clusterer': ['YMapClusterer', 'clusterByGrid'],
                    '@yandex/ymaps3-default-ui-theme': [
                        'YMapZoomControl',
                        'YMapRotateControl',
                        'YMapTiltControl',
                        'YMapRotateTiltControl',
                        'YMapSearchControl',
                        'YMapDefaultRuler',
                        'YMapGeolocationControl'
                    ]
                }
            });
        }

        async function build(elem, yandexmapProps) {
            const ymaps3 = await getYandexApi();

            if (!ymaps3) {
                return;
            }

            // Отступ карты - % от меньшей величины размеров карты
            const marginPx = Math.min(elem.clientWidth, elem.clientHeight) * (yandexmapProps['map_padding'] / 100);

            const cfg = {
                location: {
                    center: [yandexmapProps['center_lng'], yandexmapProps['center_lat']],
                    zoom: yandexmapProps['zoom'],
                },
                showScaleInCopyrights: true,
                behaviors: ['pinchRotate'],
                margin: [marginPx, marginPx, marginPx, marginPx]
            };

            if (yandexmapProps['dragging'] && !utilsModule.isMobileDevice()) {
                cfg.behaviors.push('drag');
            }

            if (yandexmapProps['zooming']) {
                cfg.behaviors.push('scrollZoom', 'pinchZoom');
                cfg.zoomRange = {
                    min: parseInt(yandexmapProps['min_zoom']),
                    max: parseInt(yandexmapProps['max_zoom'])
                };
            }

            // при использовании компонента uk-height-viewport с параметром offset-top: true,
            // скрипт вычисляет значение min-height. Так как контейнер для яндекс карт должен иметь атрибут height,
            // здесь мы просто присваиваем атрибуту height вычисленное значение min-height.
            if (elem.__uikit__ && elem.__uikit__.heightViewport) {
                elem.style.height = elem.__uikit__.heightViewport._data.minHeight;
            }
            //
            const map = new ymaps3.YMap(elem, cfg);
            switch (yandexmapProps['type']) {
                case 'satellite':
                    map.addChild(new ymaps3.YMapDefaultSatelliteLayer());
                    break;
                case 'scheme':
                default:
                    map.addChild(new ymaps3.YMapDefaultSchemeLayer({
                        theme: yandexmapProps['map_theme']
                    }));
                    break;
            }
            map.addChild(new ymaps3.YMapDefaultFeaturesLayer());

            // список маркеров с открытыми всплывающими окнами
            let activeMarkers = new Set();
            const YANDEX_ELEMENT_TAG = "ymaps3";
            const CustomMarker = createCustomMarker(ymaps3.YMapDefaultMarker, {
                getMap: () => map,
                getActiveMarkers: () => activeMarkers,
                getUtilsModule: () => utilsModule,
                getYandexElementTag: () => YANDEX_ELEMENT_TAG
            });

            let markersWithShowOnLoadPopup = [];
            if (yandexmapProps['markers']) {
                const isClustering = yandexmapProps['clustering'] === true;
                const markers = [];

                for (const markerData of yandexmapProps['markers']) {
                    let contentHTML = '';
                    contentHTML += utilsModule.popupImage(yandexmapProps, markerData);
                    contentHTML += utilsModule.popupElem('title', yandexmapProps, markerData['title']);
                    contentHTML += utilsModule.popupElem('meta', yandexmapProps, markerData['meta']);
                    contentHTML += utilsModule.popupElem('content', yandexmapProps, markerData['content'], false);
                    contentHTML += utilsModule.popupLink(yandexmapProps, markerData);

                    const parsedCoordinates = utilsModule.parseCoordinates(markerData['location']);
                    if (!parsedCoordinates) {
                        continue;
                    }
                    const [lat, lng] = parsedCoordinates;

                    const markerCfg = {
                        coordinates: [lng, lat],
                        props: yandexmapProps,
                        markerProps: markerData
                    };
                    if (!markerData['hide_popup']) {
                        markerCfg.popup = {
                            content: contentHTML,
                            position: markerData['popup_position']
                        };
                    }
                    if (yandexmapProps['show_title'] && markerData['title']) {
                        markerCfg.title = markerData['title'];
                    }

                    // обработчик события загрузки всплывающего окна
                    markerCfg.popupToggled = (position, coordinates, width, height) => {
                        let xOffsetInPixels = 0;
                        let yOffsetInPixels = 0;

                        if (position === 'top') {
                            yOffsetInPixels = 68 + height / 2;
                        } else {
                            xOffsetInPixels = 23 + width / 2;
                            if (position === 'left') {
                                xOffsetInPixels *= -1;
                            }
                        }

                        const [rotatedXOffsetInPixels, rotatedYOffsetInPixels] = utilsModule.rotatePixelOffsets(xOffsetInPixels, yOffsetInPixels, -map.azimuth);

                        const offsetInLongitude = utilsModule.convertPixelOffsetToLongitude(map, rotatedXOffsetInPixels, cfg.margin);
                        const offsetInLatitude = utilsModule.convertPixelOffsetToLatitude(map, rotatedYOffsetInPixels, cfg.margin);

                        let moveTo = [coordinates[0] + offsetInLongitude, coordinates[1] + offsetInLatitude];
                        map.update({location: {center: moveTo, ...MARKER_ANIMATION}});
                    };
                    markers.push(new CustomMarker(markerCfg));
                    if (markerData['show_popup']) {
                        markersWithShowOnLoadPopup.push(markers[markers.length - 1]);
                    }
                }

                if (isClustering) {
                    const featureList = markers.map((value, i) => ({
                        type: 'Feature',
                        id: i,
                        geometry: {
                            coordinates: value.coordinates,
                            element: value
                        }
                    }));

                    const markerRendering = (feature) => feature.geometry.element;
                    const clusterRendering = (coordinates, features) => {
                        return new ymaps3.YMapMarker({
                            coordinates: coordinates,
                            onClick: () => {
                                const bounds = utilsModule.getBounds(features.map(feature => feature.geometry.coordinates));
                                map.update({camera: {azimuth: 0}, location: {bounds: bounds, ...CLUSTER_ANIMATION}});
                            }
                        }, utilsModule.cluster(yandexmapProps, features.length).cloneNode(true));
                    }

                    let clusterGridSize = yandexmapProps['cluster_grid_size'];
                    if (!clusterGridSize || clusterGridSize < 1) {
                        clusterGridSize = 1;
                    }
                    const CustomMapClusterer = clusterModule.createCustomMapClusterer(ymaps3.YMapClusterer, () => activeMarkers);
                    const clusterer = new CustomMapClusterer({
                        method: clusterModule.customClusterByGrid({gridSize: clusterGridSize, getActiveMarkers: () => activeMarkers}),
                        features: featureList,
                        marker: markerRendering,
                        cluster: clusterRendering
                    });
                    map.addChild(clusterer);
                } else {
                    markers.forEach(value => {
                        map.addChild(value);
                    });
                }

                // Закрываем всплывающее окно при клике вне его области
                let lastInteractableMarker = null;
                map.addChild(new ymaps3.YMapListener({
                    layer: 'any',
                    onClick: (object) => {
                        if (object) {
                            if (object?.type === 'marker') {
                                activeMarkers.forEach(marker => {
                                    if (object?.entity === marker?.children?.[0]) {
                                        lastInteractableMarker = marker;
                                        // console.log('set interactable marker -', marker._popupProps);
                                    }
                                });
                            }
                        } else if (lastInteractableMarker) {
                            lastInteractableMarker._togglePopup(0, false);
                            lastInteractableMarker = null;
                            // console.log('close last interactable marker');
                        } else {
                            const lastActiveMarker = [...activeMarkers][activeMarkers.size - 1];
                            // console.warn('click outside any markers and there is no last interactable marker, try to close last active marker', lastActiveMarker?._popupProps);
                            lastActiveMarker?._togglePopup(0, false);
                        }
                        /*console.warn('click on', object.type);
                        if (object.type === 'marker') {
                            console.warn(object.entity, activeMarkers.values().next().value);
                            console.warn(object.entity === activeMarkers.values().next().value.children[0]);
                        }*/
                        /*if (lastMarkerWithOpenedPopup && !object) {
                            lastMarkerWithOpenedPopup._togglePopup(0, false);
                        }*/
                    }
                }));

                // перемещаем карту к последнему добавленному маркеру
                if (yandexmapProps['centering_mode'] === 'onLastMarker' && markers.length > 0) {
                    const [lastMarkerLng, lastMarkerLat] = markers[markers.length - 1].coordinates;
                    map.update({location: {center: [lastMarkerLng, lastMarkerLat], ...MARKER_ANIMATION}});
                }
                // центрируем карту так, чтобы вместить все установленные маркеры
                if (yandexmapProps['centering_mode'] === 'fitAllMarkers') {
                    const bounds = utilsModule.getBounds(markers.map(val => val.coordinates));
                    bounds[0][1] += utilsModule.convertPixelOffsetToLatitude(map, yandexmapProps['center_offset_y'] || 0, cfg.margin);
                    bounds[1][1] += utilsModule.convertPixelOffsetToLatitude(map, yandexmapProps['center_offset_y'] || 0, cfg.margin);
                    bounds[0][0] -= utilsModule.convertPixelOffsetToLongitude(map, yandexmapProps['center_offset_x'] || 0, cfg.margin);
                    bounds[1][0] -= utilsModule.convertPixelOffsetToLongitude(map, yandexmapProps['center_offset_x'] || 0, cfg.margin);

                    if (markers.length === 1) {
                        map.update({location: {center: [bounds[0][0], bounds[0][1]], ...MARKER_ANIMATION}});
                    } else if (markers.length > 1) {
                        map.update({location: {bounds: bounds, ...MARKER_ANIMATION}});
                    }
                }
            }

            const mapControls = {
                'top': {list: [], panel: new ymaps3.YMapControls({position: 'top'})},
                'left': {list: [], panel: new ymaps3.YMapControls({position: 'left'})},
                'bottom': {list: [], panel: new ymaps3.YMapControls({position: 'bottom'})},
                'right': {list: [], panel: new ymaps3.YMapControls({position: 'right'})},
                'topLeft': {list: [], panel: new ymaps3.YMapControls({position: 'top left'})},
                'topRight': {list: [], panel: new ymaps3.YMapControls({position: 'top right'})},
                'bottomLeft': {list: [], panel: new ymaps3.YMapControls({position: 'bottom left'})},
                'bottomRight': {list: [], panel: new ymaps3.YMapControls({position: 'bottom right'})}
            };

            function addMapControl(propName, element) {
                if (!yandexmapProps[propName]) {
                    return;
                }

                const panel = yandexmapProps[propName + '_panel'];
                const order = yandexmapProps[propName + '_order'];

                mapControls[panel].list.push({value: element, priority: order});
            }

            addMapControl('show_zoom_controls', new ymaps3.YMapZoomControl());

            const fullScreenBtn = document.createElement('div');
            fullScreenBtn.classList.add(`${YANDEX_ELEMENT_TAG}--control-fullscreen`);
            fullScreenBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_1470_10318)" transform="matrix(0.938241, 0, 0, 0.938102, -1.285652, -1.081787)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M23.752 4.59473C23.7619 4.45662 23.6471 4.3418 23.5089 4.35171L18.4336 4.71611C18.1746 4.7347 18.0574 5.04912 18.241 5.23274L19.7842 6.776L14.771 11.7892L16.3141 13.3323L21.3273 8.31911L22.8709 9.86269C23.0545 10.0463 23.369 9.92909 23.3876 9.67008L23.752 4.59473Z" fill="currentColor"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.56835 23.2952C4.55844 23.4333 4.67326 23.5481 4.81137 23.5382L9.88672 23.1738C10.1457 23.1552 10.263 22.8408 10.0793 22.6571L8.53608 21.1139L13.5493 16.1007L12.0062 14.5576L6.99297 19.5708L5.44938 18.0272C5.26577 17.8436 4.95134 17.9608 4.93275 18.2198L4.56835 23.2952Z" fill="currentColor"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_1470_10318">
                      <rect width="24" height="24" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
            `;
            addMapControl('show_fullscreen_control', new ymaps3.YMapControlButton({
                onClick: () => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                        fullScreenBtn.classList.remove('ymaps-control-active');
                    } else {
                        map.container.parentNode.requestFullscreen();
                        fullScreenBtn.classList.add('ymaps-control-active');
                    }
                },
                element: fullScreenBtn
            }));

            controlsModule.addRulerControl({
                ymaps3,
                getMap: () => map,
                getYandexmapProps: () => yandexmapProps,
                getMapControls: () => mapControls,
                getYandexElementTag: () => YANDEX_ELEMENT_TAG
            });

            addMapControl('show_geolocation_control', new ymaps3.YMapGeolocationControl());
            addMapControl('show_rotate_control', new ymaps3.YMapRotateControl());
            addMapControl('show_tilt_control', new ymaps3.YMapTiltControl());
            addMapControl('show_rotate_tilt_controls', new ymaps3.YMapRotateTiltControl());

            const searchControl = controlsModule.addSearchControl({
                ymaps3,
                getMap: () => map,
                getYandexmapProps: () => yandexmapProps,
                getMapControls: () => mapControls,
                getUtilsModule: () => utilsModule
            });

            // Добавление элементов управления на карту
            for (let panel in mapControls) {
                mapControls[panel].list.sort((a, b) => a.priority - b.priority);
                mapControls[panel].list.forEach(o => mapControls[panel].panel.addChild(o.value));
                if (mapControls[panel].list.length > 0) {
                    map.addChild(mapControls[panel].panel);
                }
            }

            // Открытие всплывающих окон при загрузке страницы,
            // если указан соответствующий параметр в настройках маркера
            markersWithShowOnLoadPopup.forEach(marker => {
                marker._togglePopup(1, false);
            });

            searchControl.postprocess();

            // Логика перетаскивания карты двумя пальцами для моб. устройств
            if (utilsModule.isMobileDevice()) {
                let hint = document.createElement('div');
                hint.innerHTML = 'Передвинуть карту можно двумя пальцами';
                hint.classList.add('map-hint-mobile');
                elem.appendChild(hint);

                let touchCount = 0;
                let touchStartTime = 0;

                elem.addEventListener('touchstart', e => {
                    touchCount = e.targetTouches.length;
                    if (touchCount === 1) {
                        touchStartTime = Date.now();
                    } else if (touchCount === 2) {
                        hint.style.opacity = '0';
                        if (map.behaviors.indexOf('drag') === -1) {
                            map.behaviors.push('drag');
                            map.setBehaviors(map.behaviors);
                        }
                    }
                });
                elem.addEventListener('touchmove', e => {
                    if (activeMarkers.size === 0 && touchCount === 1 && Date.now() - touchStartTime > 100) {
                        hint.style.opacity = '1';
                    }
                });
                elem.addEventListener('touchend', e => {
                    hint.style.opacity = '0';

                    if (map.behaviors.indexOf('drag') !== -1) {
                        map.setBehaviors(map.behaviors.filter(value => value !== 'drag'));
                    }
                });
            }
        }

        w.component("Yandexmap", {
            connected() {
                if (this.script || (this.script = a.$("script", this.$el)),
                    !this.script
                ) {
                    return;
                }
                const yandexmapProps = JSON.parse(this.script.textContent);
                build(this.$el, yandexmapProps);
            }
        })
    })(UIkit, UIkit.util);
});
