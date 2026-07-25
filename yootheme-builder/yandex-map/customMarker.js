export function createCustomMarker(YMapDefaultMarker, {
    getMap,
    getActiveMarkers,
    getUtilsModule,
    getYandexElementTag = () => 'ymaps3'
}) {
    const YANDEX_ELEMENT_TAG = getYandexElementTag();
    const MARKER_CLASS_PREFIX = `${YANDEX_ELEMENT_TAG}--default-marker__`;

    return class CustomMarker extends YMapDefaultMarker {
        _createPopupRoot(position, hidesMarker) {
            if (this._popup) {
                this._popup.innerHTML = "";
            } else {
                this._popup = document.createElement(YANDEX_ELEMENT_TAG);
            }

            this._popup.className = `${MARKER_CLASS_PREFIX}popup_${hidesMarker ? "center" : position} ${MARKER_CLASS_PREFIX}hider`;
            this._popup.classList.add(`${MARKER_CLASS_PREFIX}popup`);

            return this._popup;
        }

        _createPopupContainer(contentHtml) {
            const popupContainer = document.createElement(YANDEX_ELEMENT_TAG);
            popupContainer.classList.add(`${MARKER_CLASS_PREFIX}popup-container`);
            popupContainer.innerHTML = contentHtml;
            return popupContainer;
        }

        _applyPopupStyling(popupContainer) {
            if (this._props.markerProps['popup_padding'] || this._props.props['popup_padding']) {
                popupContainer.classList.add(this._props.markerProps['popup_padding'] || this._props.props['popup_padding']);
            }
            if (this._props.markerProps['popup_padding_remove_top']) {
                popupContainer.classList.add('uk-padding-remove-top');
            }
            if (this._props.markerProps['popup_padding_remove_bottom']) {
                popupContainer.classList.add('uk-padding-remove-bottom');
            }
            if (this._props.markerProps['popup_padding_remove_left']) {
                popupContainer.classList.add('uk-padding-remove-left');
            }
            if (this._props.markerProps['popup_padding_remove_right']) {
                popupContainer.classList.add('uk-padding-remove-right');
            }
            if (this._props.markerProps['popup_padding_remove_horizontal']) {
                popupContainer.classList.add('uk-padding-remove-horizontal');
            }
            if (this._props.markerProps['popup_padding_remove_vertical']) {
                popupContainer.classList.add('uk-padding-remove-vertical');
            }
            // Set minimum width for popup
            if (this._props.markerProps['popup_min_width'] || this._props.props['popup_min_width']) {
                this._popup.style.minWidth = this._props.markerProps['popup_min_width'] || this._props.props['popup_min_width'];
            }
            // Set maximum width for popup
            if (this._props.markerProps['popup_max_width'] || this._props.props['popup_max_width']) {
                this._popup.style.maxWidth = this._props.markerProps['popup_max_width'] || this._props.props['popup_max_width'];
            }
        }

        _createPopupCloseButton() {
            const closeButton = document.createElement("button");
            closeButton.className = 'uk-modal-close-default';
            closeButton.type = 'button';
            closeButton.setAttribute('uk-close', '');
            closeButton.onclick = () => this._togglePopup(!1);
            return closeButton;
        }

        _createPopup() {
            const {position, content, hidesMarker} = this._popupProps;
            this._popup = this._createPopupRoot(position, hidesMarker);
            if (typeof content === "string") {
                const popupContainer = this._createPopupContainer(content);
                this._applyPopupStyling(popupContainer);
                this._popup.appendChild(popupContainer);
                this._popup.appendChild(this._createPopupCloseButton());
            } else if (typeof content === 'function') {
                this._popup.appendChild(content((() => this._togglePopup(!1))));
            } else {
                throw new TypeError('WT YOOtheme Yandex Map: "content" must be a string or function!');
            }

            return this._popup;
        }

        _togglePopup(e, closeOtherPopups = true, shouldFirePopupToggledEvent = true) {
            // Если всплывающее окно уже открыто - ничего не делаем
            if (e && this._popupIsOpen) {
                return;
            }

            const activeMarkers = getActiveMarkers();

            // Закрываем все остальные всплывающие окна
            if (closeOtherPopups && e) {
                activeMarkers.forEach(marker => {
                    if (marker !== this && marker?._popupIsOpen) {
                        marker._togglePopup(0, false);
                    }
                });
            }

            super._togglePopup(e);

            if (e) {
                // добавляем текущий маркер в список активных
                activeMarkers.add(this);

                this._marker.update({hideOutsideViewport: false});

                const map = getMap();
                const popupContainer = getUtilsModule().getMapElement(this._popup, 'default-marker__popup-container');
                if (popupContainer) {
                    popupContainer.style.maxHeight = (map.size.y - 42 - 72 * 2) + 'px';
                    popupContainer.style.overflow = "auto";
                    popupContainer.addEventListener('wheel', e => {
                        e.stopPropagation();
                    }, {passive: true});
                }

                if (!shouldFirePopupToggledEvent) {
                    return;
                }

                // Вызов события popupToggled и пересчет размеров контейнера
                const recalculatePopupSize = () => {
                    if (!this._popupIsOpen) {
                        return;
                    }

                    if (this._recalculatePopupSizeFrame != null) {
                        return;
                    }

                    this._recalculatePopupSizeFrame = requestAnimationFrame(() => {
                        this._recalculatePopupSizeFrame = null;

                        if (!this._popupIsOpen || !this._popup?.isConnected) {
                            return;
                        }

                        const containerWidth = this._popup.offsetWidth;
                        const containerHeight = this._popup.offsetHeight;

                        // console.warn('recalculate popup size', containerWidth, containerHeight, this._popupProps);

                        this._props.popupToggled(
                            this._popupProps.position,
                            this._props.coordinates,
                            containerWidth,
                            containerHeight
                        );
                    });
                };

                // Проводим первичную оценку размеров всплывающего окна и центрируем его "как есть".
                // После загрузки "ленивых" изображений будет проведено повторное центрирование с учетом их размеров.
                // console.warn('plan first recalculate for', this._popupProps);
                recalculatePopupSize();

                const lazyImages = this._popup.querySelectorAll('img[loading="lazy"]');

                if (lazyImages.length > 0) {
                    const waitForLazyImage = (img) => {
                        return new Promise((resolve) => {
                            // не проверяем img.naturalWidth, т.к. в данном случае не важно,
                            // успешно загрузилось изображение или нет.
                            if (img.complete) {
                                // console.warn('img complete, called resolve');
                                resolve();
                                return;
                            }

                            // console.warn('img onLoad/onError, called resolve');
                            img.addEventListener('load', resolve, {once: true});
                            img.addEventListener('error', resolve, {once: true});
                        });
                    };

                    // если всплывающее окно содержит изображения с "ленивой" загрузкой,
                    // то уточняем центрирование после окончания загрузки каждого изображения
                    lazyImages.forEach(img => {
                        waitForLazyImage(img).then(() => {
                            // console.warn('plan recalculate after waiting for lazy image', img, this._popupProps);
                            recalculatePopupSize();
                        });
                    });
                } else {
                    // console.warn('popup already fully loaded', this._popupProps);
                }
            } else {
                // удаляем маркер из списка активных, т.к. всплывающее окно закрывается
                activeMarkers.delete(this);

                this._marker.update({hideOutsideViewport: true});
            }
        }

        _image(icon, width, height, offsetX, offsetY, loading, border) {
            const elem = document.createElement('img');
            elem.src = getUtilsModule().processSrc(icon);
            elem.loading = loading ? 'eager' : 'lazy';
            if (border) {
                elem.classList.add('uk-border-' + border);
            }
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
                const o = document.createElement(YANDEX_ELEMENT_TAG);
                return t && (o.className = MARKER_CLASS_PREFIX + t),
                    e.appendChild(o);
            };
            this._container = document.createElement(YANDEX_ELEMENT_TAG);
            const t = e(this._container, "view")
                , o = e(t, "icon");
            if (this._props.markerProps['marker_icon'] || this._props.props['marker_icon']) {
                o.appendChild(this._image(
                    this._props.markerProps['marker_icon'] || this._props.props['marker_icon'],
                    this._props.markerProps['marker_icon_width'] || this._props.props['marker_icon_width'],
                    this._props.markerProps['marker_icon_height'] || this._props.props['marker_icon_height'],
                    this._props.markerProps['marker_icon_offset_x'] || this._props.props['marker_icon_offset_x'],
                    this._props.markerProps['marker_icon_offset_y'] || this._props.props['marker_icon_offset_y'],
                    this._props.markerProps['marker_icon_loading'] || this._props.props['marker_icon_loading'],
                    this._props.markerProps['marker_icon_border'] || this._props.props['marker_icon_border']
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
}
