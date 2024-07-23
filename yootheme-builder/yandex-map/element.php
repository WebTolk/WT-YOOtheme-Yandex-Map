<?php

namespace YOOtheme;

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\WebAsset\WebAssetManager;

/* @var $wa WebAssetManager */
$wa = Factory::getApplication()->getDocument()->getWebAssetManager();

$plugin = PluginHelper::getPlugin('system', 'wtyoothemeyandexmap');
$api_key = json_decode($plugin->params)->yandex_map_api_key;

// Подключаем API 3.0 Яндекс карт
$wa->registerAndUseScript('plg.system.wtyoothemeyandexmap_api', "https://api-maps.yandex.ru/3.0/?apikey={$api_key}&lang=ru_RU");
$wa->registerAndUseStyle('plg.system.wtyoothemeyandexmap_popup_style', 'plugins/system/wtyoothemeyandexmap/yootheme-builder/yandex-map/element.css');

return [
    'transforms' => [
        'render' => function ($node) {
            $node->props['metadata'] = [];
            $node->props['metadata']['script:plg.system.wtyoothemeyandexmap_element'] = [
                'src' => 'plugins/system/wtyoothemeyandexmap/yootheme-builder/yandex-map/element.js'
            ];
            
            foreach ($node->children as $child)
            {
                if (empty($child->props['location'])) {
                    continue;
                }

                if (!empty($child->props['hide'])) {
                    continue;
                }

                $node->props['markers'][] = $child->props;
            }

            return true;
        }
    ]
];
