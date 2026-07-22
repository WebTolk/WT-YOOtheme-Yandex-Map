/**
 * @param YMapClusterer - родительский класс из Yandex Maps Api
 * @param getActiveMarkers - функция-геттер для списка маркеров с открытым всплывающим окном
 * @returns {{new(): CustomMapClusterer, prototype: CustomMapClusterer}}
 */
export function createCustomMapClusterer(YMapClusterer, getActiveMarkers) {
    return class CustomMapClusterer extends YMapClusterer {
        _isVisible(e, t, s) {
            let res = super._isVisible(e, t, s);

            if (typeof getActiveMarkers !== 'function') {
                throw new TypeError('WT YOOtheme Yandex Map: getActiveMarkers must be a function!');
            }

            const activeMarkers = getActiveMarkers();
            if (!(activeMarkers instanceof Set)) {
                throw new TypeError('WT YOOtheme Yandex Map: getActiveMarkers function must return a Set!');
            }

            // отменяем сокрытие активных маркеров при кластеризации
            if (e.type === 'Feature' && activeMarkers && activeMarkers.has(e.geometry.element)) {
                return true;
            }

            return res;
        }
    }
}

/**
 * @param gridSize - ширина сетки кластеризации
 * @param getActiveMarkers - функция-геттер для списка маркеров с открытым всплывающим окном
 */
export function customClusterByGrid({gridSize, getActiveMarkers}) {
    return new ClusterMethod(gridSize, getActiveMarkers);
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

    constructor(gridSize, getActiveMarkers) {
        this._nextFeatureIndex = 0,
            this._featureIdCharCache = {},
            this._gridSize = gridSize;

        this._getActiveMarkers = getActiveMarkers;
    }
    _hasActiveFeature(features) {
        if (typeof this._getActiveMarkers !== 'function') {
            throw new TypeError('WT YOOtheme Yandex Map: _getActiveMarkers must be a function!');
        }

        const activeMarkers = this._getActiveMarkers();
        if (!(activeMarkers instanceof Set)) {
            throw new TypeError('WT YOOtheme Yandex Map: _getActiveMarkers function must return a Set!');
        }

        if (!Array.isArray(features) || activeMarkers.size === 0) {
            return false;
        }

        return features.some(feature => activeMarkers.has(feature?.geometry?.element));
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
                // отрисовываем активные маркеры, даже если они находятся за пределами видимости
                if (!this._hasActiveFeature(s.features)) {
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
