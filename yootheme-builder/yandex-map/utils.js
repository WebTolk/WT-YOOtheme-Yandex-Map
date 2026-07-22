export function isMobileDevice() {
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    const hasMobileWidth = window.innerWidth < 768;

    return isMobileUserAgent && hasTouch;
}

export function getMapElement(container, elementClass) {
    // Проверяем новую (ymaps3) и старую (ymaps) версию тэга элемента.
    // Проверяем новый (ymaps3) и старый (ymaps3x0) префикс классов.
    return container.querySelector(`ymaps3.ymaps3--${elementClass}`)
        || container.querySelector(`ymaps3.ymaps3x0--${elementClass}`)
        || container.querySelector(`ymaps.ymaps3--${elementClass}`)
        || container.querySelector(`ymaps.ymaps3x0--${elementClass}`)
        || null;
}

export function processSrc(value) {
    let srcAttr = '';

    if (value && !value.startsWith('/') && !value.startsWith('http://') && !value.startsWith('https://')) {
        srcAttr = '/';
    }

    srcAttr += value;
    return srcAttr;
}

export function parseCoordinates(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    const parts = value.split(',');
    if (parts.length !== 2) {
        return null;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    return [
        parseFloat(lat.toFixed(6)),
        parseFloat(lng.toFixed(6))
    ];
}

export function cluster(yandexmapProps, count) {
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
        const loading = yandexmapProps['cluster_icon_1_loading'];
        const border = yandexmapProps['cluster_icon_1_border'];

        const iconWithImage = document.createElement('img');
        iconWithImage.classList.add('cluster-icon-image');
        iconWithImage.src = processSrc(icon);
        iconWithImage.loading = loading ? 'eager' : 'lazy';
        if (border) {
            iconWithImage.classList.add('uk-border-' + border);
        }
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

export function getBounds(coordinates) {
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

export function convertPixelOffsetToLatitude(map, pixelOffset, margin) {
    const [top = 0, , bottom = 0] = margin || [];
    const effectiveHeight = Math.max(1, map.size.y - top - bottom);
    const latitudeYDiff = Math.abs(map.bounds[0][1] - map.bounds[1][1]);
    const latitudePerPixel = latitudeYDiff / effectiveHeight;
    return pixelOffset * latitudePerPixel;
}

export function convertPixelOffsetToLongitude(map, pixelOffset, margin) {
    const [, right = 0, , left = 0] = margin || [];
    const effectiveWidth = Math.max(1, map.size.x - left - right);
    const longitudeXDiff = Math.abs(map.bounds[0][0] - map.bounds[1][0]);
    const longitudePerPixel = longitudeXDiff / effectiveWidth;
    return pixelOffset * longitudePerPixel;
}

export function rotatePixelOffsets(x, y, angleInRad) {
    const cos = Math.cos(angleInRad);
    const sin = Math.sin(angleInRad);
    return [x * cos + y * sin, -x * sin + y * cos];
}

export function popupLink(props, marker) {
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

export function popupImage(props, marker) {
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

export function popupElem(type, props, value, isTextContent = true) {
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

export function setTopMargin(elem, margin) {
    let className = 'uk-margin-';
    if (margin) {
        className += margin + '-';
    }
    className += 'top';
    elem.classList.add(className);
}

export function addOptionalClass(elem, prefix, value) {
    if (value) {
        elem.classList.add(prefix + value);
    }
}
