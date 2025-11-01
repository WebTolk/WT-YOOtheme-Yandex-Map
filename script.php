<?php
/**
 * @package    WT YOOTheme Yandex Map
 * @version    1.2.1
 * @Author     Andrey Smirnikov, https://web-tolk.ru
 * @copyright  Copyright (C) 2025 Andrey Smirnikov
 * @license    GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since      1.0.0
 */

use Joomla\CMS\Application\AdministratorApplication;
use Joomla\CMS\Factory;
use Joomla\CMS\Installer\InstallerAdapter;
use Joomla\CMS\Installer\InstallerScriptInterface;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Version;
use Joomla\Database\DatabaseDriver;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;

// No direct access
defined('_JEXEC') or die;

return new class () implements ServiceProviderInterface {

    public function register(Container $container): void
    {
        $container->set(
            InstallerScriptInterface::class,
            new class ($container->get(AdministratorApplication::class)) implements InstallerScriptInterface {

                /**
             * The application object
             *
             * @var AdministratorApplication $app
             *
             * @since 1.0.0
             */
            protected AdministratorApplication $app;

            /**
             * The Database object.
             *
             * @var DatabaseDriver $db
             *
             * @since 1.0.0
             */
            protected DatabaseDriver $db;

            /**
             * Minimum Joomla version required to install the extension.
             *
             * @var string $minimumJoomla
             *
             * @since 1.0.0
             */
            protected string $minimumJoomla = '4.2';

            /**
             * Minimum PHP version required to install the extension.
             *
             * @var string $minimumPhp
             *
             * @since 1.0.0
             */
            protected string $minimumPhp = '8.0';

            /**
             * Constructor.
             *
             * @param  AdministratorApplication  $app  The application object.
             *
             * @since  1.0.0
             */
            public function __construct(AdministratorApplication $app)
            {
                $this->app = $app;
                $this->db = Factory::getContainer()->get('DatabaseDriver');
            }

            /**
             * Function called after the extension is installed.
             *
             * @param   InstallerAdapter  $adapter  The adapter calling this method
             *
             * @return  boolean  True on success
             *
             * @since   1.0.0
             */
            public function install(InstallerAdapter $adapter): bool
            {
                $this->enablePlugin($adapter);

                return true;
            }

            /**
             * Function called after the extension is updated.
             *
             * @param   InstallerAdapter  $adapter  The adapter calling this method
             *
             * @return  boolean  True on success
             *
             * @since   1.0.0
             */
            public function update(InstallerAdapter $adapter): bool
            {
                return true;
            }

            /**
             * Function called after the extension is uninstalled.
             *
             * @param   InstallerAdapter  $adapter  The adapter calling this method
             *
             * @return  boolean  True on success
             *
             * @since   1.0.0
             */
            public function uninstall(InstallerAdapter $adapter): bool
            {
                return true;
            }

            /**
             * Function called before extension installation/update/removal procedure commences.
             *
             * @param   string            $type     The type of change (install or discover_install, update, uninstall)
             * @param   InstallerAdapter  $adapter  The adapter calling this method
             *
             * @return  boolean  True on success
             *
             * @since   1.0.0
             */
            public function preflight(string $type, InstallerAdapter $adapter): bool
            {
                // Check compatible
                if (!$this->checkCompatible($adapter->getElement())) {
                    return false;
                }

                return true;
            }

            /**
             * Function called after extension installation/update/removal procedure commences.
             *
             * @param   string            $type     The type of change (install or discover_install, update, uninstall)
             * @param   InstallerAdapter  $adapter  The adapter calling this method
             *
             * @return  boolean  True on success
             *
             * @since   1.0.0
             */
            public function postflight(string $type, InstallerAdapter $adapter): bool
            {
                $smile = '';
                if ($type != 'uninstall') {
                    $smiles = ['&#9786;', '&#128512;', '&#128521;', '&#128525;', '&#128526;', '&#128522;', '&#128591;'];
                    $smile_key = array_rand($smiles, 1);
                    $smile = $smiles[$smile_key];
                } else {
                    $smile = '&#128546';
                }

                $smile .= $smile . ' ';

                $element = 'PLG_' . strtoupper($adapter->getElement());
                $type = strtoupper($type);
                $header = Text::_($element . '_AFTER_' . $type) . ' <br/>' . Text::_($element);
                $message = Text::_($element . '_DESC');
                $message .= Text::_($element . '_WHATS_NEW');

                $html = '
                <div class="row m-0">
                    <div class="col-12 col-md-8 p-0 pe-2">
                        <h2>' . $smile . $header .'</h2>
                        ' . $message . '
                    </div>
                    <div class="col-12 col-md-4 p-0 d-flex flex-column justify-content-start">
                        <img width="180" src="https://web-tolk.ru/web_tolk_logo_wide.png">
                        <p>Joomla Extensions</p>
                        <p class="btn-group">
                            <a class="btn btn-sm btn-outline-primary" href="https://web-tolk.ru" target="_blank"> https://web-tolk.ru</a>
                            <a class="btn btn-sm btn-outline-primary" href="mailto:info@web-tolk.ru"><i class="icon-envelope"></i> info@web-tolk.ru</a>
                        </p>
                        <div class="btn-group-vertical mb-3 web-tolk-btn-links" role="group" aria-label="Joomla community links">
                            <a class="btn btn-danger text-white w-100" href="https://t.me/joomlaru" target="_blank">' . Text::_($element . '_JOOMLARU_TELEGRAM_CHAT') . '</a>
                            <a class="btn btn-primary text-white w-100" href="https://t.me/webtolkru" target="_blank">' . Text::_($element . '_WEBTOLK_TELEGRAM_CHANNEL') . '</a>
                        </div>
                        ' . Text::_($element . "_MAYBE_INTERESTING") . '
                    </div>
                </div>
                ';

                $this->app->enqueueMessage($html, 'info');

                return true;
            }

            /**
             * Enable plugin after installation.
             *
             * @param   InstallerAdapter  $adapter  Parent object calling object.
             *
             * @return  void
             *
             * @since   1.1.0
             */
            protected function enablePlugin(InstallerAdapter $adapter): void
            {
                // Prepare plugin object
                $plugin = new \stdClass();
                $plugin->type = 'plugin';
                $plugin->element = $adapter->getElement();
                $plugin->folder = (string) $adapter->getParent()->manifest->attributes()['group'];
                $plugin->enabled = 1;

                // Update record
                $this->db->updateObject('#__extensions', $plugin, ['type', 'element', 'folder']);
            }

            /**
             * Method to check compatible.
             *
             * @return  boolean  True on success, False on failure.
             *
             * @throws  Exception
             *
             * @since   1.1.0
             */
            protected function checkCompatible(string $element): bool
            {
                $element = 'PLG_' . strtoupper($element);
                // Check joomla version
                if (!(new Version)->isCompatible($this->minimumJoomla)) {
                    $this->app->enqueueMessage(Text::sprintf($element . '_ERROR_COMPATIBLE_JOOMLA', $this->minimumJoomla), 'error');

                    return false;
                }

                // Check PHP
                if (!(version_compare(PHP_VERSION, $this->minimumPhp) >= 0)) {
                    $this->app->enqueueMessage(Text::sprintf($element . '_ERROR_COMPATIBLE_PHP', $this->minimumPhp), 'error');

                    return false;
                }

                return true;
            }
        });
    }
};