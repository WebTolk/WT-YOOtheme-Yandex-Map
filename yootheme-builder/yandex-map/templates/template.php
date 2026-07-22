<?php

use Joomla\CMS\Language\Text;
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
        'width: {width}px;',
        'height: 300px; {@!height} {@!viewport_height}',
        'height: {height}px; {@!viewport_height}',
        'height: 100vh; {@viewport_height: viewport} {@!viewport_height_viewport} {@!viewport_height_offset_top}',
        'height: {viewport_height_viewport}vh; {@viewport_height: viewport} {@!viewport_height_offset_top}'
    ],

    'uk-height-viewport' => $props['viewport_height'] === 'viewport' && $props['viewport_height_offset_top'] ? [
        'offset-top: true {@viewport_height_offset_top}'
    ] : false,

    'uk-yandexmap' => true
]);

$options = [];
foreach ($props as $key => $value) {
    $options[$key] = $value;
}

$script = $this->el('script', ['type' => 'application/json'], json_encode($options));

Text::script('PLG_WTYOOTHEMEYANDEXMAP_ERROR_API_KEY_NEEDED');
Text::script('PLG_WTYOOTHEMEYANDEXMAP_RULER_FINISH');
Text::script('PLG_WTYOOTHEMEYANDEXMAP_RULER_FINISH_TOOLTIP');
Text::script('PLG_WTYOOTHEMEYANDEXMAP_RULER_DELETE_ALL_TOOLTIP');

?>
<?= $el($props, $attrs); ?>
    <?= $script(); ?>
<?= $el->end(); ?>
