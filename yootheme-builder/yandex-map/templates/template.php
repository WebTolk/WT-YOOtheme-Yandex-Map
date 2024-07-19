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
        'yandex-map-element'
    ],

    'style' => [
        'width: {width}px',
        'height: [300px {@!height}][{height}px]'
    ],

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
