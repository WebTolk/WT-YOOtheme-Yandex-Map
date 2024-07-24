document.addEventListener('DOMContentLoaded', () => {
    (function(w, a) {
        //"use strict";
        async function C(elem, yandexmapProps)
        {
            await ymaps3.ready;
            const {YMapZoomControl} = await ymaps3.import('@yandex/ymaps3-controls@0.0.1');
            const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');
            const {YMapClusterer, clusterByGrid} = await ymaps3.import('@yandex/ymaps3-clusterer@0.0.1');

            const isZoomEnable = yandexmapProps['zooming'];
            const cfg = {
                location: {
                    center: [yandexmapProps['center_x'], yandexmapProps['center_y']],
                    zoom: yandexmapProps['zoom'],
                },
                showScaleInCopyrights: true,
                behaviors: []
            };

            if (yandexmapProps['dragging'])
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

            // при использовании компонента uk-height-viewport с параметром offset-top: true,
            // скрипт вычисляет значение min-height. Так как контейнер для яндекс карт должен иметь атрибут height,
            // здесь мы просто присваиваем атрибуту height вычисленное значение min-height.
            if (elem.__uikit__.heightViewport)
            {
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

            const k = 'ymaps3x0--default-marker__';
            class CustomMarker extends YMapDefaultMarker
            {
                get coordinates() {
                    return this._marker.coordinates
                }

                constructor(props) {
                    super(props);
                }

                _createMarker() {
                    const marker = super._createMarker();
                    if (this._props.markerProps['show_popup'])
                    {
                        super._togglePopup(1);
                    }
                    return marker;
                }

                _image(icon, width, height)
                {
                    const elem = document.createElement('img');
                    elem.src = icon;
                    if (width)
                    {
                        elem.style.width = width + 'px';
                    }
                    if (height)
                    {
                        elem.style.height = height + 'px';
                        elem.style.position = 'absolute';
                        elem.style.top = 'calc(50% - ' + (height / 2) + 'px)';
                    }

                    return elem;
                }

                _createContainer()
                {
                    const e = (e,t)=> {
                        const o = document.createElement("ymaps");
                        return t && (o.className = k + t),
                            e.appendChild(o)
                    };
                    this._container = document.createElement("ymaps");
                    const t = e(this._container, "view")
                        , o = e(t, "icon");
                    if (this._props.markerProps['marker_icon'] || this._props.props['marker_icon'])
                    {
                        o.appendChild(this._image(
                            this._props.markerProps['marker_icon'] ? this._props.markerProps['marker_icon'] : this._props.props['marker_icon'],
                            this._props.markerProps['marker_icon_width'] ? this._props.markerProps['marker_icon_width'] : this._props.props['marker_icon_width'],
                            this._props.markerProps['marker_icon_height'] ? this._props.markerProps['marker_icon_height'] : this._props.props['marker_icon_height']
                        ));
                    }
                    else
                    {
                        e(o, "icon-box").innerHTML = '<svg viewBox="0 0 60 68" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n    <defs>\n        <path\n            d="M23.51 51.523a.5.5 0 0 1-.5.477c-.29 0-.51-.21-.52-.477-.145-3.168-1.756-5.217-4.832-6.147C7.53\n            42.968 0 33.863 0 23 0 10.297 10.297 0 23 0s23 10.297 23 23c0 10.863-7.53 19.968-17.658 22.376-3.076.93-4.687\n            2.98-4.83 6.147z"\n            id="&-id-svg-filter">\n        </path>\n        <filter x="-21.7%" y="-15.4%" width="143.5%" height="138.5%" filterUnits="objectBoundingBox" id="&-svg-filter">\n        <feGaussianBlur in="SourceGraphic" stdDeviation="3"></feGaussianBlur>\n        <feComponentTransfer>\n            <feFuncA type="linear" slope=".3"></feFuncA>\n        </feComponentTransfer>\n        </filter>\n    </defs>\n    <g fill="none" fill-rule="evenodd">\n        <g fill-rule="nonzero" transform="translate(7 5)" fill="currentColor">\n            <use filter="url(#&-svg-filter)" xlink:href="#&-id-svg-filter"></use>\n            <use xlink:href="#&-id-svg-filter"></use>\n        </g>\n        <path d="M30 68c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#fff" fill-rule="nonzero"></path>\n        <path d="M30 66a2 2 0 1 0 .001-3.999A2 2 0 0 0 30 66z" fill="currentColor"></path>\n    </g>\n</svg>';
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
                        this._container.style.color = this._props.color,
                        this._container
                }
            }

            if (yandexmapProps['markers'])
            {
                const isClustering = yandexmapProps['clustering'] === true;
                const markerCoordinates = [];
                for (const markerData of yandexmapProps['markers'])
                {
                    let contentHTML = '';
                    contentHTML += popupImage(yandexmapProps, markerData);
                    contentHTML += popupElem('title', yandexmapProps, markerData['title']);
                    contentHTML += popupElem('meta', yandexmapProps, markerData['meta']);
                    contentHTML += popupElem('content', yandexmapProps, markerData['content'], true);
                    contentHTML += popupLink(yandexmapProps, markerData);

                    const [lat, lng] = markerData['location'].split(',');
                    const markerCfg = {
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                        popup: {content: contentHTML, position: 'left'},
                        props: yandexmapProps,
                        markerProps: markerData
                    };
                    if (yandexmapProps['show_title'] && markerData['title'])
                    {
                        markerCfg.title = markerData['title'];
                    }

                    if (isClustering)
                    {
                        markerCoordinates.push({coordinates: [lng, lat], element: new CustomMarker(markerCfg)});
                    }
                    else
                    {
                        map.addChild(new CustomMarker(markerCfg));
                    }
                }

                if (isClustering)
                {
                    const featureList = markerCoordinates.map((value, i) => ({
                        type: 'Feature',
                        id: i,
                        geometry: {coordinates: value.coordinates, element: value.element}
                    }));

                    const markerRender = (feature) => feature.geometry.element;
                    const clusterRender = (coordinates, features) => new ymaps3.YMapMarker({coordinates}, circle(features.length).cloneNode(true));

                    const clusterer = new YMapClusterer({
                        method: clusterByGrid({gridSize: 64}),
                        features: featureList,
                        marker: markerRender,
                        cluster: clusterRender
                    });
                    map.addChild(clusterer);
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

function circle(count)
{
    const circle = document.createElement('div');
    circle.classList.add('circle');
    circle.style = "width: 48px; height: 48px; background-color: rgb(255, 51, 51); border-radius: 50%; transform: translate(-50%, -50%); display: flex; justify-content: center; align-items: center;";
    circle.innerHTML = `<span style="color: white; font-size: 1.5rem" class="circle-text">${count}</span>`;
    return circle;
}

function popupLink(props, marker)
{
    if (!props['show_link'] || !marker['link'])
    {
        return '';
    }

    const link = document.createElement('div');
    setTopMargin(link, props['link_margin']);
    const aLink = document.createElement('a');
    aLink.href = marker['link'];
    if (props['link_target'])
    {
        aLink.target = '_blank';
    }
    if (marker['link_aria_label'] || props['link_aria_label'])
    {
        aLink.ariaLabel = marker['link_aria_label'] ? marker['link_aria_label'] : props['link_aria_label'];
    }
    aLink.textContent = marker['link_text'] ? marker['link_text'] : props['link_text'];
    if (props['link_style'])
    {
        if (props['link_style'] === 'link-muted' || props['link_style'] === 'link-text')
        {
            aLink.classList.add('uk-' + props['link_style']);
        }
        // button type styles
        else
        {
            aLink.classList.add('uk-button', 'uk-button-' + props['link_style']);
            addOptionalClass(aLink, 'uk-button-', props['link_size']);
            if (props['link_fullwidth'])
            {
                aLink.classList.add('uk-width-1-1');
            }
        }
    }
    link.appendChild(aLink);

    return link.outerHTML;
}

function popupImage(props, marker)
{
    if (!props['show_image'] || !marker['image'])
    {
        return '';
    }

    const img = document.createElement('img');
    img.src = marker['image'];
    if (marker['image_alt'])
    {
        img.alt = marker['image_alt'];
    }
    img.loading = props['image_loading'] ? 'eager' : 'lazy';
    if (props['image_width'])
    {
        img.width = props['image_width'];
    }
    if (props['image_height'])
    {
        img.height = props['image_height'];
    }
    if (props['image_border'])
    {
        img.classList.add('uk-border-' + props['image_border']);
    }

    return img.outerHTML;
}

function popupElem(type, props, value, isHtml = false)
{
    if (!props['show_' + type] || !value)
    {
        return '';
    }

    const elem = document.createElement(props[type + '_element'] ?? 'div');
    setTopMargin(elem, props[type + '_margin']);
    addOptionalClass(elem, 'uk-text-', props[type + '_color']);
    addOptionalClass(elem, 'uk-', props[type + '_style']);
    addOptionalClass(elem, 'uk-heading-', props[type + '_decoration']);
    addOptionalClass(elem, 'uk-font-', props[type + '_font_family']);
    if (isHtml)
    {
        elem.innerHTML = value;
    }
    else
    {
        elem.textContent = value;
    }

    return elem.outerHTML;
}

function setTopMargin(elem, margin)
{
    let className = 'uk-margin-';
    if (margin)
    {
        className += margin + '-';
    }
    className += 'top';
    elem.classList.add(className);
}

function addOptionalClass(elem, prefix, value)
{
    if (value)
    {
        elem.classList.add(prefix + value);
    }
}