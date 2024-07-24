<?php

use YOOtheme\Metadata;
use function YOOtheme\app;

/** @var Metadata $metadata */
$metadata = app(Metadata::class);

foreach ($props['metadata'] as $name => $attributes) {
    $metadata->set($name, $attributes);
}

$el = $this->el('div', [
    'class' => [
        'yandex-map-element',
        'uk-position-relative',
        'uk-position-z-index'
    ],

    'style' => [
        'width: {width}px',
        'height: 300px {@!height} {@!viewport_height}',
        'height: {height}px {@!viewport_height}',
        'height: 100vh {@viewport_height: viewport} {@!viewport_height_viewport} {@!viewport_height_offset_top}',
        'height: {viewport_height_viewport}vh {@viewport_height: viewport} {@!viewport_height_offset_top}'
    ],

    'uk-height-viewport' => $props['viewport_height'] === 'viewport' && $props['viewport_height_offset_top'] ? [
        'offset-top: true {@viewport_height_offset_top}'
    ] : false,

    'uk-yandexmap' => true
]);

$options = [];
foreach ($props as $k => $v)
{
    $options[$k] = $v;
}

$script = $this->el('script', ['type' => 'application/json'], json_encode($options));

?>
<p class="uk-hidden@s uk-text-center uk-margin-top">Передвинуть карту можно двумя пальцами</p>
<?= $el($props, $attrs); ?>
    <?= $script(); ?>
<?= $el->end(); ?>
