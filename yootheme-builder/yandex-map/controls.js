/**
 * @param elementTag - CSS-префикс yandex-элемента
 * @param ymaps3 - namespace Yandex Maps API v3
 * @param map - экземпляр карты
 */
export function createFullscreenControl(elementTag, ymaps3, map) {
    const fullScreenBtn = document.createElement('div');
    fullScreenBtn.classList.add(`${elementTag}--control-fullscreen`);
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

    return new ymaps3.YMapControlButton({
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
    });
}

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
