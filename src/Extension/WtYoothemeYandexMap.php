<?php
/**
 * @package       WT YOOTheme Yandex Map
 * @version       1.0.0
 * @Author        Andrey Smirnikov, https://web-tolk.ru
 * @copyright     Copyright (C) 2024 Andrey Smirnikov
 * @license       GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since         1.0.0
 */

namespace Joomla\Plugin\System\WtYoothemeYandexMap\Extension;

// No direct access
defined('_JEXEC') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\SubscriberInterface;
use YOOtheme\Application;

class WtYoothemeYandexMap extends CMSPlugin implements SubscriberInterface
{
    protected $allowLegacyListeners = false;

    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return  array
     *
     * @since   4.0.0
     */
    public static function getSubscribedEvents(): array
    {
        return [
            'onAfterInitialise' => 'onAfterInitialise'
        ];
    }

    public function onAfterInitialise(): void
    {
        if (!class_exists(Application::class, false))
        {
            return;
        }

        $app = Application::getInstance();
        $app->load(__DIR__ . '/../../yootheme-builder/bootstrap.php');
    }
}