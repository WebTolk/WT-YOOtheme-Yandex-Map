document.addEventListener('DOMContentLoaded', () => {
    (function(w, a) {
        async function build(elem, yandexmapProps) {
            try {
                await ymaps3.ready;
            } catch (e) {
                console.log(e);
                console.log('WT YOOtheme Yandex Map: Ошибка при загрузке API Яндекс Карт. Пожалуйста, укажите верный ключ API в настройках плагина!');
                return;
            }

            ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', ['@yandex/ymaps3-default-ui-theme@0.0']);

            const {YMapZoomControl} = await ymaps3.import('@yandex/ymaps3-controls@0.0.1');
            const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');
            const {YMapClusterer, clusterByGrid} = await ymaps3.import('@yandex/ymaps3-clusterer@0.0.1');
            const {YMapDefaultRuler, YMapGeolocationControl, YMapRotateControl, YMapTiltControl, YMapRotateTiltControl, YMapSearchControl} = await ymaps3.import('@yandex/ymaps3-default-ui-theme');

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

            if (yandexmapProps['dragging'] && !isMobileDevice()) {
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

            let lastMarkerWithOpenedPopup = null;
            const k = 'ymaps3x0--default-marker__';
            class CustomMarker extends YMapDefaultMarker {
                _createPopup() {
                    const {position: e, content: t, hidesMarker: o} = this._popupProps;
                    if (this._popup ? this._popup.innerHTML = "" : this._popup = document.createElement("ymaps"),
                        this._popup.className = `${k}popup_${o ? "center" : e} ${k}hider`,
                        "string" == typeof t
                    ) {
                        this._popup.classList.add(`${k}popup`);
                        const e = document.createElement("ymaps");
                        e.classList.add(`${k}popup-container`);
                        // set popup padding
                        if (this._props.markerProps['popup_padding'] || this._props.props['popup_padding']) {
                            e.classList.add(this._props.markerProps['popup_padding'] || this._props.props['popup_padding']);
                        }
                        if (this._props.markerProps['popup_padding_remove_top']) {
                            e.classList.add('uk-padding-remove-top');
                        }
                        if (this._props.markerProps['popup_padding_remove_bottom']) {
                            e.classList.add('uk-padding-remove-bottom');
                        }
                        if (this._props.markerProps['popup_padding_remove_left']) {
                            e.classList.add('uk-padding-remove-left');
                        }
                        if (this._props.markerProps['popup_padding_remove_right']) {
                            e.classList.add('uk-padding-remove-right');
                        }
                        if (this._props.markerProps['popup_padding_remove_horizontal']) {
                            e.classList.add('uk-padding-remove-horizontal');
                        }
                        if (this._props.markerProps['popup_padding_remove_vertical']) {
                            e.classList.add('uk-padding-remove-vertical');
                        }
                        e.innerHTML = t;
                        this._popup.appendChild(e);
                        // set popup minimum width
                        if (this._props.markerProps['popup_min_width'] || this._props.props['popup_min_width']) {
                            this._popup.style.minWidth = this._props.markerProps['popup_min_width'] || this._props.props['popup_min_width'];
                        }
                        // set popup maximum width
                        if (this._props.markerProps['popup_max_width'] || this._props.props['popup_max_width']) {
                            this._popup.style.maxWidth = this._props.markerProps['popup_max_width'] || this._props.props['popup_max_width'];
                        }
                        const o = document.createElement("button");
                        o.className = 'uk-modal-close-default';
                        o.type = 'button';
                        o.setAttribute('uk-close', '');
                        o.onclick = () => this._togglePopup(!1);
                        this._popup.appendChild(o);
                    } else {
                        this._popup.appendChild(t((()=>this._togglePopup(!1))));
                    }
                    return this._popup
                }

                _togglePopup(e) {
                    // Если всплывающее окно уже открыто - ничего не делаем
                    if (e && this._popupIsOpen) {
                        return;
                    }

                    // Закрываем все остальные всплывающие окна
                    if (e && lastMarkerWithOpenedPopup && lastMarkerWithOpenedPopup !== this) {
                        lastMarkerWithOpenedPopup._togglePopup(0);
                    }

                    super._togglePopup(e);

                    if (e) {
                        lastMarkerWithOpenedPopup = this;

                        this._marker.update({hideOutsideViewport: false});

                        const popupContainer = this._popup.querySelector(`.${k}popup-container`);
                        popupContainer.style.maxHeight = (map.size.y - 42 - 72 * 2) + 'px';
                        popupContainer.style.overflow = "auto";
                        popupContainer.addEventListener('wheel', e => {
                            e.stopPropagation();
                        });

                        let xOffsetInPixels = 0;
                        let yOffsetInPixels = 0;

                        if (this._popupProps.position === 'top') {
                            yOffsetInPixels = 70 + this._popup.offsetHeight / 2;
                        } else {
                            xOffsetInPixels = 26 + this._popup.offsetWidth / 2;
                            if (this._popupProps.position === 'left') {
                                xOffsetInPixels *= -1;
                            }
                        }

                        const [rotatedXOffsetInPixels, rotatedYOffsetInPixels] = rotatePixelOffsets(xOffsetInPixels, yOffsetInPixels, -map.azimuth);

                        const offsetInLongitude = convertPixelOffsetToLongitude(map, rotatedXOffsetInPixels);
                        const offsetInLatitude = convertPixelOffsetToLatitude(map, rotatedYOffsetInPixels);

                        let moveTo = [this._props.coordinates[0] + offsetInLongitude, this._props.coordinates[1] + offsetInLatitude];
                        map.update({location: {center: moveTo, easing: 'ease-in-out', duration: 400}});
                    } else {
                        lastMarkerWithOpenedPopup = null;

                        this._marker.update({hideOutsideViewport: true});
                    }
                }

                _image(icon, width, height, offsetX, offsetY) {
                    const elem = document.createElement('img');
                    elem.src = processSrc(icon);
                    if (width) {
                        elem.style.width = width + 'px';
                        elem.style.maxWidth = 'unset';
                    }
                    if (height) {
                        elem.style.height = height + 'px';
                        elem.style.position = 'absolute';
                        elem.style.top = 'calc(50% - ' + (height / 2) + 'px)';
                    }
                    if (offsetX || offsetY) {
                        elem.style.transform = 'translate(' + (offsetX || 0) + 'px, ' + (offsetY || 0) + 'px)';
                    }
                    return elem;
                }

                _createContainer() {
                    const e = (e, t) => {
                        const o = document.createElement("ymaps");
                        return t && (o.className = k + t),
                            e.appendChild(o);
                    };
                    this._container = document.createElement("ymaps");
                    const t = e(this._container, "view")
                        , o = e(t, "icon");
                    if (this._props.markerProps['marker_icon'] || this._props.props['marker_icon']) {
                        o.appendChild(this._image(
                            this._props.markerProps['marker_icon'] || this._props.props['marker_icon'],
                            this._props.markerProps['marker_icon_width'] || this._props.props['marker_icon_width'],
                            this._props.markerProps['marker_icon_height'] || this._props.props['marker_icon_height'],
                            this._props.markerProps['marker_icon_offset_x'] || this._props.props['marker_icon_offset_x'],
                            this._props.markerProps['marker_icon_offset_y'] || this._props.props['marker_icon_offset_y']
                        ));
                    } else {
                        e(o, "icon-box").innerHTML = '<svg viewBox="0 0 60 68" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path d="M23.51 51.523a.5.5 0 0 1-.5.477c-.29 0-.51-.21-.52-.477-.145-3.168-1.756-5.217-4.832-6.147C7.53 42.968 0 33.863 0 23 0 10.297 10.297 0 23 0s23 10.297 23 23c0 10.863-7.53 19.968-17.658 22.376-3.076.93-4.687 2.98-4.83 6.147z" id="&-id-svg-filter"></path><filter x="-21.7%" y="-15.4%" width="143.5%" height="138.5%" filterUnits="objectBoundingBox" id="&-svg-filter"><feGaussianBlur in="SourceGraphic" stdDeviation="3"></feGaussianBlur><feComponentTransfer><feFuncA type="linear" slope=".3"></feFuncA></feComponentTransfer></filter></defs><g fill="none" fill-rule="evenodd"><g fill-rule="nonzero" transform="translate(7 5)" fill="currentColor"><use filter="url(#&-svg-filter)" xlink:href="#&-id-svg-filter"></use><use xlink:href="#&-id-svg-filter"></use></g><path d="M30 68c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#fff" fill-rule="nonzero"></path><path d="M30 66a2 2 0 1 0 .001-3.999A2 2 0 0 0 30 66z" fill="currentColor"></path></g></svg>';
                    }
                    const n = e(o);
                    e(n, "icon-dot");
                    const p = e(t, "title-box")
                        , i = e(p, "title-wrapper")
                        , r = e(i, "title");
                    this._props.title && (r.innerHTML = this._props.title);
                    const s = e(i, "subtitle");
                    return this._props.subtitle && (s.innerHTML = this._props.subtitle),
                        this._props.popup && (this._container.style.cursor = "pointer"),
                        this._container.style.color = this._props.markerProps['marker_color'] || this._props.props['marker_color'],
                        this._container;
                }
            }

            class CustomMapClusterer extends YMapClusterer {
                _isVisible(e, t, s) {
                    let res = super._isVisible(e, t, s);

                    // если открыто всплывающее окно маркера, то отменяем сокрытие такого маркера при кластеризации
                    if (e.type === 'Feature' && e.geometry.element === lastMarkerWithOpenedPopup) {
                        return true;
                    }

                    return res;
                }
            }

            function customClusterByGrid({gridSize: e}) {
                return new ClusterMethod(e);
            }

            class ClusterMethod {
                u_ZO(t, e, i={x:0,y:0}) {
                    return i.x = t.x / e, i.y = t.y / e, i;
                }

                h_B_convertPixelSizeToWorldSize(t, e, i) {
                    const n = 256;
                    const o = Math.pow(2, e) / 2 * n;
                    return this.s_WT(t, {
                        x: o,
                        y: -o
                    }, i);
                }

                s_WT(t, e, i={x:0,y:0}) {
                    return i.x = t.x / e.x, i.y = t.y / e.y, i;
                }

                constructor(e) {
                    this._nextFeatureIndex = 0,
                    this._featureIdCharCache = {},
                    this._gridSize = e
                }
                _getClusterSizeWorld(e) {
                    return this.h_B_convertPixelSizeToWorldSize({
                        x: this._gridSize,
                        y: 0
                    }, e).x
                }
                _computeVisibleClusters(e, t, s) {
                    const r = this.u_ZO(this.h_B_convertPixelSizeToWorldSize(e, t), 2)
                        , i = s.y + r.y
                        , o = s.y - r.y
                        , n = s.x - r.x
                        , a = s.x + r.x
                        , l = this._getClusterSizeWorld(t)
                        , c = Math.floor(n / l)
                        , d = Math.ceil(a / l)
                        , p = Math.floor(i / l)
                        , _ = Math.ceil(o / l)
                        , m = new Map;
                    for (let e = c; e <= d; e++)
                        for (let t = p; t <= _; t++)
                            m.set(`${e}-${t}`, !0);
                    return m
                }
                _clusterize(e, t, s) {
                    const r = new Map
                        , i = this._getClusterSizeWorld(s);
                    for (const s of t) {
                        const t = {
                            world: e.projection.toWorldCoordinates(s.geometry.coordinates),
                            lnglat: s.geometry.coordinates,
                            clusterId: "",
                            features: [s]
                        }
                            , o = `${Math.floor(t.world.x / i)}-${Math.floor(t.world.y / i)}`;
                        let n = r.get(o);
                        n || (n = {
                            sumX: 0,
                            sumY: 0,
                            objects: [],
                            features: []
                        },
                            r.set(o, n)),
                            n.sumX += t.world.x,
                            n.sumY += t.world.y,
                            n.objects.push(t),
                            n.features.push(t.features[0])
                    }
                    return r
                }
                _generateClusterId(e) {
                    const t = ["cluster-"];
                    return e.forEach(( ({id: e}) => {
                            this._featureIdCharCache[e] || (this._featureIdCharCache[e] = String.fromCharCode(this._nextFeatureIndex),
                                this._nextFeatureIndex += 1),
                                t.push(this._featureIdCharCache[e])
                        }
                    )),
                        t.join("")
                }
                render({map: e, features: t}) {
                    const s = Math.round(e.zoom)
                        , r = this._computeVisibleClusters(e.size, s, e.projection.toWorldCoordinates(e.center))
                        , i = this._clusterize(e, t, s)
                        , o = [];
                    for (const [t,s] of i.entries()) {
                        if (!r.get(t)) {
                            // отрисовываем маркер с открытым всплывающим окном, даже если он находится за пределом видимости
                            if (lastMarkerWithOpenedPopup && s.features[0].geometry.element === lastMarkerWithOpenedPopup) {

                            } else {
                                continue;
                            }
                        }
                        const i = s.objects.length;
                        if (1 === i)
                            o.push(Object.assign(Object.assign({}, s.objects[0]), {
                                clusterId: s.features[0].id
                            }));
                        else {
                            const t = {
                                x: s.sumX / i,
                                y: s.sumY / i
                            };
                            o.push({
                                world: t,
                                lnglat: e.projection.fromWorldCoordinates(t),
                                clusterId: this._generateClusterId(s.features),
                                features: s.features
                            })
                        }
                    }
                    return o
                }
            }

            let markerWithShowOnLoadPopup;
            if (yandexmapProps['markers']) {
                const isClustering = yandexmapProps['clustering'] === true;
                const markers = [];
                for (const markerData of yandexmapProps['markers']) {
                    let contentHTML = '';
                    contentHTML += popupImage(yandexmapProps, markerData);
                    contentHTML += popupElem('title', yandexmapProps, markerData['title']);
                    contentHTML += popupElem('meta', yandexmapProps, markerData['meta']);
                    contentHTML += popupElem('content', yandexmapProps, markerData['content'], false);
                    contentHTML += popupLink(yandexmapProps, markerData);

                    const [lat, lng] = markerData['location'].split(',');
                    if (isNaN(lat) || isNaN(lng)) {
                        continue;
                    }

                    const markerCfg = {
                        coordinates: [parseFloat(parseFloat(lng).toFixed(6)), parseFloat(parseFloat(lat).toFixed(6))],
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

                    markers.push(new CustomMarker(markerCfg));
                    if (markerData['show_popup']) {
                        markerWithShowOnLoadPopup = markers[markers.length - 1];
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
                                const bounds = getBounds(features.map(feature => feature.geometry.coordinates));
                                map.update({location: {bounds: bounds, easing: 'ease-in-out', duration: 250}});
                            }
                        }, cluster(yandexmapProps, features.length).cloneNode(true));
                    }

                    let clusterGridSize = yandexmapProps['cluster_grid_size'];
                    if (!clusterGridSize || clusterGridSize < 1) {
                        clusterGridSize = 1;
                    }
                    const clusterer = new CustomMapClusterer({
                        method: customClusterByGrid({gridSize: clusterGridSize}),
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
                map.addChild(new ymaps3.YMapListener({
                    layer: 'any',
                    onClick: (object) => {
                        if (lastMarkerWithOpenedPopup && !object) {
                            lastMarkerWithOpenedPopup._togglePopup(0);
                        }
                    }
                }));

                // перемещаем карту к последнему добавленному маркеру
                if (yandexmapProps['centering_mode'] === 'onLastMarker' && markers.length > 0) {
                    const [lastMarkerLng, lastMarkerLat] = markers[markers.length - 1].coordinates;
                    map.update({location: {center: [lastMarkerLng, lastMarkerLat], easing: 'ease-in-out', duration: 400}});
                }
                // центрируем карту так, чтобы вместить все установленные маркеры
                if (yandexmapProps['centering_mode'] === 'fitAllMarkers') {
                    const bounds = getBounds(markers.map(val => val.coordinates));
                    bounds[0][1] += convertPixelOffsetToLatitude(map, yandexmapProps['center_offset_y'] || 0);
                    bounds[1][1] += convertPixelOffsetToLatitude(map, yandexmapProps['center_offset_y'] || 0);
                    bounds[0][0] -= convertPixelOffsetToLongitude(map ,yandexmapProps['center_offset_x'] || 0);
                    bounds[1][0] -= convertPixelOffsetToLongitude(map ,yandexmapProps['center_offset_x'] || 0);

                    if (markers.length === 1) {
                        map.update({location: {center: [bounds[0][0], bounds[0][1]], easing: 'ease-in-out', duration: 400}});
                    } else if (markers.length > 1) {
                        map.update({location: {bounds: bounds, easing: 'ease-in-out', duration: 400}});
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

            addMapControl('show_zoom_controls', new YMapZoomControl());

            const fullScreenBtn = document.createElement('div');
            fullScreenBtn.classList.add('ymaps3x0--control-fullscreen');
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

            // МОДУЛЬ ЛИНЕЙКИ СТАРТ
            rulerComponent = new YMapDefaultRuler({
                type: 'ruler',
                editable: true,
                points: [],
                onFinish: () => {
                    editable = false;
                }
            });
            const rulerModeElem = document.createElement('span');
            rulerModeElem.textContent = 'Расстояние';
            const rulerModeButton = new ymaps3.YMapControlButton({
                onClick: () => {
                    rulerComponent.update({type: 'ruler'});
                    rulerModeElem.classList.add('ymaps-control-active');
                    planimeterModeElem.classList.remove('ymaps-control-active');
                },
                element: rulerModeElem
            });

            const planimeterModeElem = document.createElement('span');
            planimeterModeElem.textContent = 'Площадь';
            const planimeterModeButton = new ymaps3.YMapControlButton({
                onClick: () => {
                    rulerComponent.update({type: 'planimeter'});
                    planimeterModeElem.classList.add('ymaps-control-active');
                    rulerModeElem.classList.remove('ymaps-control-active');
                },
                element: planimeterModeElem
            });

            let rulerActive = false;
            if (yandexmapProps['show_ruler_control']) {
                const panel = yandexmapProps['show_ruler_control_panel'];
                const order = yandexmapProps['show_ruler_control_order'];

                const rulerIcon = document.createElement('div');
                rulerIcon.classList.add('ymaps3x0--control-ruler');
                rulerIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.56 14.363L14.363 3.56a1.91 1.91 0 0 1 2.7 0l3.377 3.376a1.91 1.91 0 0 1 0 2.7L9.636 20.442a1.91 1.91 0 0 1-2.7 0l-3.377-3.377a1.91 1.91 0 0 1 0-2.7zm4.12-.743l1.282-1.282 1.823 1.824a.764.764 0 1 0 1.08-1.082l-1.824-1.822 1.216-1.215 1.148 1.145a.763.763 0 0 0 1.318-.534.765.765 0 0 0-.237-.545l-1.148-1.147 1.282-1.283 1.824 1.824a.764.764 0 0 0 1.08-1.082l-1.825-1.824 1.014-1.012a.478.478 0 1 0-.676-.675L4.91 15.038a.478.478 0 0 0 .675.675l1.012-1.012 1.15 1.146a.764.764 0 1 0 1.08-1.079L7.679 13.62v.001z" fill="currentColor"></path></svg>';
                mapControls[panel].list.push({value: new ymaps3.YMapControlButton({
                    onClick: () => {
                        rulerIcon.classList.toggle('ymaps-control-active');

                        if (!rulerActive) {
                            rulerComponent.update({type: 'ruler', editable: true});
                            map.addChild(rulerComponent);

                            rulerModeElem.classList.add('ymaps-control-active');
                            planimeterModeElem.classList.remove('ymaps-control-active');

                            mapControls[panel].panel.addChild(rulerModeButton);
                            mapControls[panel].panel.addChild(planimeterModeButton);

                            rulerActive = true;
                        } else {
                            map.removeChild(rulerComponent);

                            mapControls[panel].panel.removeChild(rulerModeButton);
                            mapControls[panel].panel.removeChild(planimeterModeButton);

                            rulerActive = false;
                        }
                    },
                    //text: 'Линейка'
                    element: rulerIcon
                }), priority: order});
            }
            // МОДУЛЬ ЛИНЕЙКИ КОНЕЦ

            addMapControl('show_geolocation_control', new YMapGeolocationControl());
            addMapControl('show_rotate_control', new YMapRotateControl());
            addMapControl('show_tilt_control', new YMapTiltControl());
            addMapControl('show_rotate_tilt_controls', new YMapRotateTiltControl());

            const lastSearchedMarkers = [];
            let searchInputValue = '';
            const clearSearchResultHandler = () => {
                lastSearchedMarkers.forEach(marker => {
                    map.removeChild(marker);
                });
            };
            const searchResultHandler = (results) => {
                const searchControlInput = document.querySelector('.ymaps3--search-control__input');
                if (searchControlInput) {
                    searchControlInput.value = searchInputValue;
                    searchControlInput.dispatchEvent(new Event('input'));
                }

                clearSearchResultHandler();

                results.forEach(result => {
                    const searchResultMarker = new YMapDefaultMarker({
                        title: result.properties.name,
                        subtitle: result.properties.description,
                        coordinates: result.geometry.coordinates,
                        onClick: () => {
                            map.update({location: {center: result.geometry.coordinates, easing: 'ease-in-out', zoom: 17, duration: 400}});
                        }
                    });
                    searchResultMarker._container.style.cursor = 'pointer';
                    map.addChild(searchResultMarker);

                    const title = searchResultMarker._marker.element.querySelector('.ymaps3x0--default-marker__title');
                    if (title.scrollWidth > title.offsetWidth) {
                        title.title = title.textContent;
                    }

                    const subtitle = searchResultMarker._marker.element.querySelector('.ymaps3x0--default-marker__subtitle');
                    if (subtitle.scrollWidth > subtitle.offsetWidth) {
                        subtitle.title = subtitle.textContent;
                    }

                    lastSearchedMarkers.push(searchResultMarker);
                });

                if (results.length === 1) {
                    map.update({location: {center: results[0].geometry.coordinates, easing: 'ease-in-out', zoom: 17, duration: 400}});
                } else if (results.length > 1) {
                    map.update({location: {bounds: getBounds(results.map(result => result.geometry.coordinates)), easing: 'ease-in-out', duration: 400}});
                }
            };

            addMapControl('show_search_control', new YMapSearchControl({searchResult: searchResultHandler}));

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
            if (markerWithShowOnLoadPopup) {
                markerWithShowOnLoadPopup._togglePopup(1);
            }

            // ограничиваем размер поисковых предложений размерами контейнера карты
            const yMaps3SearchControl = document.querySelector('.ymaps3--search-control');
            if (yMaps3SearchControl) {
                yMaps3SearchControl.style.maxHeight = (map.size.y - 24) + 'px';
            }
            // сохраняем крайнее введенное значение при поиске
            const yMaps3SearchControlInput = document.querySelector('.ymaps3--search-control__input');
            if (yMaps3SearchControlInput) {
                yMaps3SearchControlInput.addEventListener('input', e => {
                    if (e.isTrusted) {
                        searchInputValue = e.target.value;
                        if (!e.target.value) {
                            clearSearchResultHandler();
                        }
                    }
                });
            }
            // удаляем маркеры при очищении поисковой строки
            const yMaps3SearchControlClear = document.querySelector('.ymaps3--search-control__clear');
            if (yMaps3SearchControlClear) {
                yMaps3SearchControlClear.addEventListener('click', e => {
                    searchInputValue = '';
                    clearSearchResultHandler();
                });
            }

            // Логика перетаскивания карты двумя пальцами для моб. устройств
            if (isMobileDevice()) {
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
                    if (!lastMarkerWithOpenedPopup && touchCount === 1 && Date.now() - touchStartTime > 100) {
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

function isMobileDevice() {
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    const hasMobileWidth = window.innerWidth < 768;

    return isMobileUserAgent && hasTouch;
}

function processSrc(value) {
    let srcAttr = '';

    if (value && !value.startsWith('/') && !value.startsWith('http://') && !value.startsWith('https://')) {
        srcAttr = '/';
    }

    srcAttr += value;
    return srcAttr;
}

function cluster(yandexmapProps, count) {
    const clusterEl = document.createElement('div');
    clusterEl.classList.add('cluster');

    const text = document.createElement('span');
    text.classList.add('cluster-text');
    text.textContent = count;

    if (yandexmapProps['cluster_icon_1']) {
        const icon = yandexmapProps['cluster_icon_1'];
        const width = yandexmapProps['cluster_icon_1_width'];
        const height = yandexmapProps['cluster_icon_1_height'];
        const offsetX = yandexmapProps['cluster_icon_1_offset_x'];
        const offsetY = yandexmapProps['cluster_icon_1_offset_y'];

        const iconWithImage = document.createElement('img');
        iconWithImage.classList.add('cluster-icon-image');
        iconWithImage.src = processSrc(icon);
        if (width) {
            iconWithImage.style.width = width + 'px';
        }
        if (height) {
            iconWithImage.style.height = height + 'px';
        }
        if (offsetX || offsetY) {
            iconWithImage.style.transform = 'translate(' + (offsetX || 0) + 'px, ' + (offsetY || 0) + 'px)';
        }

        clusterEl.appendChild(iconWithImage);

        if (yandexmapProps['cluster_icon_1_text_color']) {
            text.style.color = yandexmapProps['cluster_icon_1_text_color'];
        }
    } else {
        const icon = document.createElement('div');
        icon.classList.add('cluster-icon');
        clusterEl.appendChild(icon);
    }

    clusterEl.appendChild(text);
    return clusterEl;
}

function getBounds(coordinates) {
    let minLat = Infinity, minLng = Infinity;
    let maxLat = -Infinity, maxLng = -Infinity;

    for (const coords of coordinates) {
        const lat = coords[1];
        const lng = coords[0];

        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
    }

    return [
        [minLng, minLat],
        [maxLng, maxLat]
    ];
}

function convertPixelOffsetToLatitude(map, pixelOffset) {
    const latitudeYDiff = Math.abs(map.bounds[0][1] - map.bounds[1][1]);
    const latitudePerPixel = latitudeYDiff / map.size.y;
    return pixelOffset * latitudePerPixel;
}

function convertPixelOffsetToLongitude(map, pixelOffset) {
    const longitudeXDiff = Math.abs(map.bounds[0][0] - map.bounds[1][0]);
    const longitudePerPixel = longitudeXDiff / map.size.x;
    return pixelOffset * longitudePerPixel;
}

function rotatePixelOffsets(x, y, angleInRad) {
    const cos = Math.cos(angleInRad);
    const sin = Math.sin(angleInRad);
    return [x * cos + y * sin, -x * sin + y * cos];
}

function popupLink(props, marker) {
    if (!props['show_link'] || !marker['link']) {
        return '';
    }

    const link = document.createElement('div');
    setTopMargin(link, props['link_margin']);
    const aLink = document.createElement('a');
    aLink.href = marker['link'];
    if (props['link_target']) {
        aLink.target = '_blank';
    }
    if (marker['link_aria_label'] || props['link_aria_label']) {
        aLink.ariaLabel = marker['link_aria_label'] || props['link_aria_label'];
    }
    aLink.textContent = marker['link_text'] || props['link_text'];
    if (props['link_style']) {
        if (props['link_style'] === 'link-muted' || props['link_style'] === 'link-text') {
            aLink.classList.add('uk-' + props['link_style']);
        } else {
            // button type styles
            aLink.classList.add('uk-button', 'uk-button-' + props['link_style']);
            addOptionalClass(aLink, 'uk-button-', props['link_size']);
            if (props['link_fullwidth']) {
                aLink.classList.add('uk-width-1-1');
            }
        }
    }
    link.appendChild(aLink);

    return link.outerHTML;
}

function popupImage(props, marker) {
    if (!props['show_image'] || !marker['image']) {
        return '';
    }

    const img = document.createElement('img');
    img.src = processSrc(marker['image']);
    if (marker['image_alt']) {
        img.alt = marker['image_alt'];
    }
    img.loading = props['image_loading'] ? 'eager' : 'lazy';
    if (props['image_width']) {
        img.width = props['image_width'];
    }
    if (props['image_height']) {
        img.height = props['image_height'];
    }
    if (props['image_border']) {
        img.classList.add('uk-border-' + props['image_border']);
    }

    return img.outerHTML;
}

function popupElem(type, props, value, isTextContent = true) {
    if (!props['show_' + type] || !value) {
        return '';
    }

    const elem = document.createElement(props[type + '_element'] || 'div');
    setTopMargin(elem, props[type + '_margin']);
    addOptionalClass(elem, 'uk-text-', props[type + '_color']);
    addOptionalClass(elem, 'uk-', props[type + '_style']);
    addOptionalClass(elem, 'uk-heading-', props[type + '_decoration']);
    addOptionalClass(elem, 'uk-font-', props[type + '_font_family']);
    if (isTextContent) {
        elem.textContent = value;
    } else {
        elem.innerHTML = value;
    }

    return elem.outerHTML;
}

function setTopMargin(elem, margin) {
    let className = 'uk-margin-';
    if (margin) {
        className += margin + '-';
    }
    className += 'top';
    elem.classList.add(className);
}

function addOptionalClass(elem, prefix, value) {
    if (value) {
        elem.classList.add(prefix + value);
    }
}