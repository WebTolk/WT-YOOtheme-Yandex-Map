/**
 * @param ymaps3 - namespace Yandex Maps API v3
 * @param getMap - функция-геттер экземпляра карты
 * @param getActivePanel - функция-геттер активной панели контролов, в которую во время работы линейки добавляются кнопки выбора режима
 * @param YANDEX_ELEMENT_TAG - CSS-префикс yandex-элемента
 */
export function addRulerControl({
    ymaps3,
    getMap,
    getActivePanel,
    YANDEX_ELEMENT_TAG = 'ymaps3'
}) {
    const localizeRulerActionButtons = root => {
        root?.querySelectorAll('.ymaps3--default-ruler-point_actions').forEach(actions => {
            const finishButton = actions.querySelector('.ymaps3--default-ruler-point_actions__finish');
            if (finishButton) {
                finishButton.title = Joomla?.Text?._('PLG_WTYOOTHEMEYANDEXMAP_RULER_FINISH_TOOLTIP');
                finishButton.querySelector('span:last-child')?.replaceChildren(
                    Joomla?.Text?._('PLG_WTYOOTHEMEYANDEXMAP_RULER_FINISH')
                );
            }

            const deleteButton = actions.querySelector('button:not(.ymaps3--default-ruler-point_actions__finish)');
            if (deleteButton) {
                deleteButton.title = Joomla?.Text?._('PLG_WTYOOTHEMEYANDEXMAP_RULER_DELETE_ALL_TOOLTIP');
            }
        });
    };

    let rulerLocalizationFrameId = null;

    const stopRulerActionsLocalization = () => {
        if (rulerLocalizationFrameId !== null) {
            cancelAnimationFrame(rulerLocalizationFrameId);
            rulerLocalizationFrameId = null;
        }
    };

    const scheduleRulerActionsLocalization = container => {
        stopRulerActionsLocalization();
        rulerLocalizationFrameId = requestAnimationFrame(() => {
            rulerLocalizationFrameId = null;
            localizeRulerActionButtons(container);
        });
    };

    function handleRulerMapClick() {
        if (!rulerActive) {
            return;
        }

        scheduleRulerActionsLocalization(getMap().container);
    }

    // МОДУЛЬ ЛИНЕЙКИ СТАРТ
    const rulerComponent = new ymaps3.YMapDefaultRuler({
        type: 'ruler',
        editable: true,
        points: [],
        onFinish: () => {
            rulerComponent.update({editable: false});
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

    const rulerIcon = document.createElement('div');
    rulerIcon.classList.add(`${YANDEX_ELEMENT_TAG}--control-ruler`);
    rulerIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.56 14.363L14.363 3.56a1.91 1.91 0 0 1 2.7 0l3.377 3.376a1.91 1.91 0 0 1 0 2.7L9.636 20.442a1.91 1.91 0 0 1-2.7 0l-3.377-3.377a1.91 1.91 0 0 1 0-2.7zm4.12-.743l1.282-1.282 1.823 1.824a.764.764 0 1 0 1.08-1.082l-1.824-1.822 1.216-1.215 1.148 1.145a.763.763 0 0 0 1.318-.534.765.765 0 0 0-.237-.545l-1.148-1.147 1.282-1.283 1.824 1.824a.764.764 0 0 0 1.08-1.082l-1.825-1.824 1.014-1.012a.478.478 0 1 0-.676-.675L4.91 15.038a.478.478 0 0 0 .675.675l1.012-1.012 1.15 1.146a.764.764 0 1 0 1.08-1.079L7.679 13.62v.001z" fill="currentColor"></path></svg>';

    const rulerControl = new ymaps3.YMapControlButton({
        onClick: () => {
            const map = getMap();
            const activePanel = getActivePanel();
            rulerIcon.classList.toggle('ymaps-control-active');

            if (!rulerActive) {
                rulerComponent.update({type: 'ruler', editable: true});
                map.addChild(rulerComponent);
                map.container.addEventListener('click', handleRulerMapClick, true);

                rulerModeElem.classList.add('ymaps-control-active');
                planimeterModeElem.classList.remove('ymaps-control-active');

                const controlIndex = activePanel.children.indexOf(rulerControl);
                const insertIndex = controlIndex >= 0 ? controlIndex + 1 : activePanel.children.length;
                activePanel.addChild(rulerModeButton, insertIndex);
                activePanel.addChild(planimeterModeButton, insertIndex + 1);

                rulerActive = true;
            } else {
                stopRulerActionsLocalization();
                map.container.removeEventListener('click', handleRulerMapClick, true);
                map.removeChild(rulerComponent);

                activePanel.removeChild(rulerModeButton);
                activePanel.removeChild(planimeterModeButton);

                rulerActive = false;
            }
        },
        element: rulerIcon
    });

    return rulerControl;
    // МОДУЛЬ ЛИНЕЙКИ КОНЕЦ
}

/**
 * @param ymaps3 - namespace Yandex Maps API v3
 * @param getMap - функция-геттер экземпляра карты
 * @param getUtilsModule - функция-геттер вспомогательного модуля карты
 * @param MARKER_ANIMATION - объект с параметрами анимации для маркера
 * @returns {{element: *, afterAttachCallback: (function(): void)}}
 */
export function addSearchControl({
    ymaps3,
    getMap,
    getUtilsModule,
    MARKER_ANIMATION
}) {
    const lastSearchedMarkers = [];
    let searchInputValue = '';
    const clearSearchResultHandler = () => {
        const map = getMap();
        lastSearchedMarkers.forEach(marker => {
            map.removeChild(marker);
        });
        lastSearchedMarkers.length = 0;
    };

    const searchResultHandler = (results) => {
        const map = getMap();
        const utilsModule = getUtilsModule();
        const searchControl = yMapSearchControl?._search;
        const searchControlInput = searchControl?._searchInput;
        const searchControlClearButton = searchControl?._clearButton;

        // Сохранение предыдущего поискового запроса в строке поиска
        if (searchControlInput) {
            // Необходимо отменить обработчик события изменения ввода перед присваиванием значения input элементу
            searchControl?._onChangeSearchInputDebounced?.cancel?.();
            searchControlInput.value = searchInputValue;
            // Очищаем значение свойства suggestNavigationAction, т.к. пользователь мог управлять панелью
            // поисковых предложений с помощью клавиатуры.
            // Таким образом при следующем открытии панели не возникнет ошибки.
            searchControl?._suggestComponent?.update({
                suggestNavigationAction: void 0
            });
        }
        if (searchControlClearButton) {
            // значение предыдущего поискового запроса установлено вручную, поэтому синхронизируем отображение кнопки "очистить"
            searchControlClearButton.classList.toggle('_hide', !searchInputValue);
        }

        clearSearchResultHandler();

        results.forEach(result => {
            const searchResultMarker = new ymaps3.YMapDefaultMarker({
                title: result.properties.name,
                subtitle: result.properties.description,
                coordinates: result.geometry.coordinates,
                onClick: () => {
                    map.update({location: {center: result.geometry.coordinates, zoom: 17, ...MARKER_ANIMATION}});
                }
            });
            searchResultMarker._container.style.cursor = 'pointer';
            map.addChild(searchResultMarker);

            const title = utilsModule.getMapElement(searchResultMarker._marker.element, 'default-marker__title');
            if (title && title.scrollWidth > title.offsetWidth) {
                title.title = title.textContent;
            }

            const subtitle = utilsModule.getMapElement(searchResultMarker._marker.element, 'default-marker__subtitle');
            if (subtitle && subtitle.scrollWidth > subtitle.offsetWidth) {
                subtitle.title = subtitle.textContent;
            }

            lastSearchedMarkers.push(searchResultMarker);
        });

        if (results.length === 1) {
            map.update({location: {center: results[0].geometry.coordinates, zoom: 17, ...MARKER_ANIMATION}});
        } else if (results.length > 1) {
            map.update({location: {bounds: utilsModule.getBounds(results.map(result => result.geometry.coordinates)), ...MARKER_ANIMATION}});
        }
    };

    const yMapSearchControl = new ymaps3.YMapSearchControl({searchResult: searchResultHandler});

    return {
        element: yMapSearchControl,
        afterAttachCallback() {
            const searchControl = yMapSearchControl?._search;

            // ограничиваем размер поисковых предложений размерами контейнера карты
            searchControl?._rootElement?.style.setProperty('max-height', `${getMap().size.y - 24}px`);
            // сохраняем крайнее введенное значение при поиске
            searchControl?._searchInput?.addEventListener('input', e => {
                if (e.isTrusted) {
                    searchInputValue = e.target.value;
                    if (!e.target.value) {
                        clearSearchResultHandler();
                    }
                }
            });
            // удаляем маркеры при очищении поисковой строки
            searchControl?._clearButton?.addEventListener('click', () => {
                searchInputValue = '';
                clearSearchResultHandler();
            });
        }
    };
}
