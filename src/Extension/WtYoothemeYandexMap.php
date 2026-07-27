<?php
/**
 * @package    WT YOOTheme Yandex Map
 * @version    1.3.0
 * @Author     Andrey Smirnikov, https://web-tolk.ru
 * @copyright  Copyright (C) 2025 Andrey Smirnikov
 * @license    GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since      1.0.0
 */

namespace Joomla\Plugin\System\WtYoothemeYandexMap\Extension;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\SubscriberInterface;
use YOOtheme\Application;

// No direct access
defined('_JEXEC') or die;

class WtYoothemeYandexMap extends CMSPlugin implements SubscriberInterface
{
    protected $autoloadLanguage = true;
    protected $allowLegacyListeners = false;

    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return  array
     *
     * @since   1.0.0
     */
    public static function getSubscribedEvents(): array
    {
        return [
            'onAfterInitialise' => 'onAfterInitialise'
        ];
    }

    public function onAfterInitialise(): void
    {
        if (!class_exists(Application::class, false)) {
            return;
        }

        $app = Application::getInstance();
        $app->load(__DIR__ . '/../../yootheme-builder/bootstrap.php');
    }
}
