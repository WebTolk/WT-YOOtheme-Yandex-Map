<?php
use YOOtheme\Config;
use YOOtheme\Path;

class CustomizerListener
{
    public static function init(Config $config): void
    {
        /* @var $wa \Joomla\CMS\WebAsset\WebAssetManager */
        $wa = \Joomla\CMS\Factory::getApplication()->getDocument()->getWebAssetManager();
        $wa->registerAndUseScript('plg.system.wtyoothemeyandexmap_map_item', 'plugins/system/wtyoothemeyandexmap/yootheme-builder/yandex-map_item/element.js');
    }
}