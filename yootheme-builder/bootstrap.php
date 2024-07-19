<?php
include_once __DIR__ . '/src/CustomizerListener.php';

use YOOtheme\Builder;
use YOOtheme\Path;

return [
    'extend' => [
        Builder::class => function (Builder $builder)
        {
            $builder->addTypePath(Path::get('./*/element.json'));
        }
    ],
    'events' => [
        'customizer.init' => [
            CustomizerListener::class => 'init'
        ]
    ]
];