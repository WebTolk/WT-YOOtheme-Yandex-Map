<?php
/**
 * @package    WT YOOTheme Yandex Map
 * @version    1.2.1
 * @Author     Andrey Smirnikov, https://web-tolk.ru
 * @copyright  Copyright (C) 2025 Andrey Smirnikov
 * @license    GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since      1.0.0
 */

use YOOtheme\Builder;
use YOOtheme\Config;
use YOOtheme\Path;
use YOOtheme\Translator;

defined('_JEXEC') or die;

class LocalizationListener
{
    private static ?string $loadedLocale = null;

    private const LOCALIZED_TYPES = [
        'yandex_map',
        'yandex-map_item',
    ];

    public static function localizeBuilderTypes(
        Builder $builder,
        Config $config,
        Translator $translator
    ): void {
        self::loadLanguage($config, $translator);

        foreach (self::LOCALIZED_TYPES as $name) {
            if (!isset($builder->types[$name])) {
                continue;
            }

            $builder->types[$name]->data = self::translateDescriptions(
                $builder->types[$name]->data,
                $translator
            );
        }
    }

    private static function loadLanguage(Config $config, Translator $translator): void
    {
        $locale = (string) $config('locale.code');

        if (self::$loadedLocale === $locale) {
            return;
        }

        $translator->addResource(Path::get("../yandex-map/languages/{$locale}.json"));
        self::$loadedLocale = $locale;
    }

    private static function translateDescriptions(array $data, Translator $translator): array
    {
        foreach ($data as $key => $value) {
            if ($key === 'description' && is_string($value) && $value !== '') {
                $data[$key] = $translator->trans($value);
                continue;
            }

            if (is_array($value)) {
                $data[$key] = self::translateDescriptions($value, $translator);
            }
        }

        return $data;
    }
}
