<?php
/**
 * @package    WT YOOTheme Yandex Map
 * @version    1.2.1
 * @Author     Andrey Smirnikov, https://web-tolk.ru
 * @copyright  Copyright (C) 2025 Andrey Smirnikov
 * @license    GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since      1.0.0
 */

namespace YOOtheme;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;

defined('_JEXEC') or die;

class YandexMapApiHelper
{
    public static function getYandexMapApi(): string|bool
    {
        $plugin = PluginHelper::getPlugin('system', 'wtyoothemeyandexmap');
        $params = json_decode($plugin->params);
        $yandex_map_api_entry_point_free = 'https://api-maps.yandex.ru/3.0';
        $yandex_map_api_entry_point_paid = 'https://enterprise.api-maps.yandex.ru/3.0';

        // Бесплатная версия по умолчанию
        $entrypoint = $yandex_map_api_entry_point_free;

        if ($params->yandex_map_api_type === 'paid') {
            $entrypoint = $yandex_map_api_entry_point_paid;
        }

        $api_key = $params->yandex_map_api_key;

        $app = Factory::getApplication();
        $language = $app->getLanguage();

        if (empty($api_key)) {
            $language->load('plg_system_wtyoothemeyandexmap', JPATH_ADMINISTRATOR);
            $app->enqueueMessage($plugin->name . ': ' . Text::_('PLG_WTYOOTHEMEYANDEXMAP_ERROR_API_KEY_NEEDED'), 'error');
            return false;
        }

        $language_tag = str_replace('-', '_', $language->getTag());

        return "{$entrypoint}/?apikey={$api_key}&lang={$language_tag}";
    }
}