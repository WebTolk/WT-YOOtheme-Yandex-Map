import * as clusterModule from './cluster.js';
import * as utilsModule from './utils.js';
import * as controlsModule from './controls.js';
import {createCustomMarker} from './customMarker.js';
import {loadYandexApi} from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    (function(w, a) {
        const YANDEX_ELEMENT_TAG = 'ymaps3';
        const CLUSTER_ANIMATION = {
            easing: 'ease-in-out',
            duration: 250
        };
        const MARKER_ANIMATION = {
            easing: 'ease-in-out',
            duration: 400
        };
        const MAP_CONTROLS_POSITIONS = {
            top: 'top',
            left: 'left',
            bottom: 'bottom',
            right: 'right',
            topLeft: 'top left',
            topRight: 'top right',
            bottomLeft: 'bottom left',
            bottomRight: 'bottom right'
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

        function createPopupToggledHandler(map, cfg) {
            return (position, coordinates, width, height) => {
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
        }

        function createMarkerConfig(map, cfg, yandexmapProps, markerData) {
            const parsedCoordinates = utilsModule.parseCoordinates(markerData['location']);

            if (!parsedCoordinates) {
                return null;
            }

            const [lat, lng] = parsedCoordinates;

            const markerCfg = {
                coordinates: [lng, lat],
                props: yandexmapProps,
                markerProps: markerData
            };

            if (!markerData['hide_popup']) {
                markerCfg.popup = {
                    content: utilsModule.buildMarkerPopupContent(yandexmapProps, markerData),
                    position: markerData['popup_position']
                };
            }

            if (yandexmapProps['show_title'] && markerData['title']) {
                markerCfg.title = markerData['title'];
            }

            markerCfg.popupToggled = createPopupToggledHandler(map, cfg);

            return markerCfg;
        }

        function applyInitialCentering(map, cfg, yandexmapProps, markers) {
            if (markers.length <= 0) {
                return;
            }

            const updateCfg = {
                location: {
                    ...MARKER_ANIMATION
                }
            };

            switch (yandexmapProps['centering_mode']) {
                case 'fromCoords':
                    if (cfg.location.center) {
                        // копируем исходный центр карты в объект конфига для применения смещений
                        updateCfg.location.center = cfg.location.center;
                    }
                    break;
                case 'onLastMarker':
                    const [lastMarkerLng, lastMarkerLat] = markers[markers.length - 1].coordinates;
                    updateCfg.location.center = [lastMarkerLng, lastMarkerLat];
                    break;
                case 'fitAllMarkers':
                    const bounds = utilsModule.getBounds(markers.map(val => val.coordinates));
                    if (markers.length === 1) {
                        updateCfg.location.center = [bounds[0][0], bounds[0][1]];
                    } else if (markers.length > 1) {
                        updateCfg.location.bounds = bounds;
                    }
                    break;
                default: break;
            }

            // Применяем смещения по X и Y к позициии карты, если они указаны
            const offsetX = yandexmapProps['center_offset_x'] || 0;
            const offsetY = yandexmapProps['center_offset_y'] || 0;
            const offsetLat = utilsModule.convertPixelOffsetToLatitude(map, offsetY, cfg.margin);
            const offsetLng = utilsModule.convertPixelOffsetToLongitude(map, offsetX, cfg.margin);

            if (updateCfg.location.center) {
                updateCfg.location.center[0] += offsetLng;
                updateCfg.location.center[1] += offsetLat;
            } else if (updateCfg.location.bounds) {
                updateCfg.location.bounds[0][1] += offsetLat;
                updateCfg.location.bounds[1][1] += offsetLat;
                updateCfg.location.bounds[0][0] -= offsetLng;
                updateCfg.location.bounds[1][0] -= offsetLng;
            }

            map.update(updateCfg);
        }

        function createMapListener(ymaps3, activeMarkers) {
            let lastInteractableMarker = null;

            return new ymaps3.YMapListener({
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
                }
            });
        }

        function createMapControls(ymaps3, mapControlsPositions) {
            return Object.fromEntries(
                Object.entries(mapControlsPositions).map(([key, position]) => [
                    key,
                    {list: [], panel: new ymaps3.YMapControls({position})}
                ])
            );
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

            // при использовании компонента uk-height-viewport с параметром offset-top: true, скрипт вычисляет значение min-height.
            // Так как контейнер для яндекс карт должен иметь атрибут height, здесь мы присваиваем атрибуту height вычисленное значение min-height.
            const heightViewport = elem.__uikit__?.heightViewport;
            if (heightViewport) {
                elem.style.height = heightViewport._data.minHeight;
            }
            //
            const map = new ymaps3.YMap(elem, cfg);
            switch (yandexmapProps['type']) {
                case 'satellite':
                    map.addChild(new ymaps3.YMapDefaultSatelliteLayer());
                    break;
                case 'scheme':
                    // Тип карты по умолчанию - схема
                default:
                    map.addChild(new ymaps3.YMapDefaultSchemeLayer({
                        theme: yandexmapProps['map_theme']
                    }));
                    break;
            }
            map.addChild(new ymaps3.YMapDefaultFeaturesLayer());

            // список маркеров с открытыми всплывающими окнами
            let activeMarkers = new Set();
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
                    const markerCfg = createMarkerConfig(map, cfg, yandexmapProps, markerData);

                    if (!markerCfg) {
                        continue;
                    }

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
                    markers.forEach(marker => {
                        map.addChild(marker);
                    });
                }

                // Добавляем обработчик событий карты - закрываем всплывающее окно при клике вне его области
                map.addChild(createMapListener(ymaps3, activeMarkers));

                // Начальное позиционирование карты
                applyInitialCentering(map, cfg, yandexmapProps, markers);
            }

            const mapControls = createMapControls(ymaps3, MAP_CONTROLS_POSITIONS);

            function addMapControl(propName, elementFactory) {
                if (!yandexmapProps[propName]) {
                    return;
                }

                if (typeof elementFactory !== 'function') {
                    throw new TypeError('WT YOOtheme Yandex Map: "elementFactory" must be a function');
                }

                const panelName = yandexmapProps[propName + '_panel'];
                const order = yandexmapProps[propName + '_order'];
                let factoryResult = elementFactory(mapControls[panelName].panel);

                if (!factoryResult) {
                    throw new TypeError('WT YOOtheme Yandex Map: "elementFactory" must return a non-null result');
                }

                if (typeof factoryResult !== 'object' || !('element' in factoryResult)) {
                    factoryResult = {element: factoryResult};
                }

                if (!factoryResult.element) {
                    throw new TypeError('WT YOOtheme Yandex Map: "factoryResult.element" property must be a non-null object');
                }

                mapControls[panelName].list.push({
                    value: factoryResult.element,
                    priority: order,
                    afterAttachCallback: factoryResult.afterAttachCallback
                });
            }

            function attachMapControls(map, mapControls) {
                for (let panelName in mapControls) {
                    const panelControls = mapControls[panelName].list;
                    const panel = mapControls[panelName].panel;

                    panelControls.sort((a, b) => a.priority - b.priority);
                    panelControls.forEach(control => {
                        panel.addChild(control.value);
                    });

                    if (panelControls.length <= 0) {
                        continue;
                    }

                    map.addChild(panel);
                    panelControls.forEach(control => {
                        control.afterAttachCallback?.();
                    });
                }
            }

            function applyMobileDrag(elem, map, activeMarkers) {
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

            addMapControl('show_zoom_controls', () => new ymaps3.YMapZoomControl());
            addMapControl('show_fullscreen_control', () => controlsModule.createFullscreenControl(YANDEX_ELEMENT_TAG, ymaps3, map));
            addMapControl('show_ruler_control', (activePanel) => controlsModule.addRulerControl({
                ymaps3,
                getMap: () => map,
                getActivePanel: () => activePanel,
                YANDEX_ELEMENT_TAG
            }));
            addMapControl('show_geolocation_control', () => new ymaps3.YMapGeolocationControl());
            addMapControl('show_rotate_control', () => new ymaps3.YMapRotateControl());
            addMapControl('show_tilt_control', () => new ymaps3.YMapTiltControl());
            addMapControl('show_rotate_tilt_controls', () => new ymaps3.YMapRotateTiltControl());
            addMapControl('show_search_control', () => controlsModule.addSearchControl({
                ymaps3,
                getMap: () => map,
                getUtilsModule: () => utilsModule,
                MARKER_ANIMATION
            }));

            // Добавление элементов управления на карту
            attachMapControls(map, mapControls);

            // Открытие всплывающих окон при загрузке страницы,
            // если указан соответствующий параметр в настройках маркера
            markersWithShowOnLoadPopup.forEach(marker => {
                // Третий параметр разрешает только отображение всплывающего окна, без центрирования
                marker._togglePopup(1, false, false);
            });

            // Логика перетаскивания карты двумя пальцами для моб. устройств
            if (utilsModule.isMobileDevice()) {
                applyMobileDrag(elem, map, activeMarkers);
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
