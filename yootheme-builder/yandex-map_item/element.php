<?php

namespace YOOtheme;

return [
    'transforms' => [
        'render' => function ($node) {
            return (bool) $node->props['location'];
        },
    ],
];
