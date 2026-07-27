<?php
/**
 * @package    WT YOOTheme Yandex Map
 * @version    1.3.0
 * @Author     Andrey Smirnikov, https://web-tolk.ru
 * @copyright  Copyright (C) 2025 Andrey Smirnikov
 * @license    GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since      1.0.0
 */

use YOOtheme\Config;
use YOOtheme\Path;
use YOOtheme\Translator;
use YOOtheme\Metadata;
use YOOtheme\YandexMapApiHelper;
use function YOOtheme\app;

defined('_JEXEC') or die;

class CustomizerListener
{
    public static function init(Config $config, Translator $translator): void
    {
        // Загружаем языковой файл
        $translator->addResource(Path::get("../yandex-map/languages/{$config('locale.code')}.json"));

        // Собственный скрипт элемента
        $metadata = app(Metadata::class);
        $metadata->set(
            'script:plg.system.wtyoothemeyandexmap_map_item',
            [
                'src' => 'plugins/system/wtyoothemeyandexmap/yootheme-builder/yandex-map_item/element.js',
                'type' => 'module',
                'defer' => true,
            ]
        );

        $yandexmap_api = YandexMapApiHelper::getYandexMapApi();

        if (!$yandexmap_api) {
            return;
        }

        // API Яндекс карт
        $metadata->set(
            'script:plg.system.wtyoothemeyandexmap_api',
            ['src' => $yandexmap_api]
        );
    }
}
