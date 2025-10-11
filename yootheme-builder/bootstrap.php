<?php
/**
 * @package    WT YOOTheme Yandex Map
 * @version    1.2.0
 * @Author     Andrey Smirnikov, https://web-tolk.ru
 * @copyright  Copyright (C) 2025 Andrey Smirnikov
 * @license    GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since      1.0.0
 */

use YOOtheme\Builder;
use YOOtheme\Path;

include_once __DIR__ . '/src/CustomizerListener.php';
include_once __DIR__ . '/src/YandexMapApiHelper.php';

// No direct access
defined('_JEXEC') or die;

return [
    'extend' => [
        Builder::class => function (Builder $builder) {
            $builder->addTypePath(Path::get('./*/element.json'));
        }
    ],
    'events' => [
        'customizer.init' => [
            CustomizerListener::class => 'init'
        ]
    ]
];