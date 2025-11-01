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

defined('_JEXEC') or die;

return [
    'transforms' => [
        'render' => function ($node) {
            return (bool) $node->props['location'];
        },
    ],
];
