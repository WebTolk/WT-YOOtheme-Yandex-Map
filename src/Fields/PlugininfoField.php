<?php
/**
 * @package       WT YOOTheme Yandex Map
 * @version       1.0.0
 * @Author        Andrey Smirnikov, https://web-tolk.ru
 * @copyright     Copyright (C) 2024 Andrey Smirnikov
 * @license       GNU/GPL http://www.gnu.org/licenses/gpl-3.0.html
 * @since         1.0.0
 */

namespace Joomla\Plugin\System\WtYoothemeYandexMap\Fields;

defined('_JEXEC') or die;

use Joomla\CMS\Form\Field\NoteField;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Factory;

class PlugininfoField extends NoteField
{

    protected $type = 'Plugininfo';

    /**
     * Method to get the field input markup for a spacer.
     * The spacer does not have accept input.
     *
     * @return  string  The field input markup.
     *
     * @since   1.7.0
     */
    protected function getInput(): string
    {
        return ' ';
    }

    /**
     * @return  string  The field label markup.
     *
     * @since   1.7.0
     */
    protected function getLabel(): string
    {
        $data = $this->form->getData();
        $element = 	$data->get('element');
        $folder = 	$data->get('folder');
        $wt_plugin_info = simplexml_load_file(JPATH_SITE."/plugins/".$folder."/".$element."/".$element.".xml");

        /* @var $doc Joomla\CMS\Document\Document */
        $doc = Factory::getApplication()->getDocument();
        $doc->getWebAssetManager()->addInlineStyle('
            #web_tolk_link {
			text-align: center;
			}
			#web_tolk_link::before{
				content: "";
			}
        ');

        return '</div>
		<div class="card container shadow-sm w-100 p-0">
			<div class="wt-b24-plugin-info row">
				<div class="col-2 d-flex justify-content-center align-items-center">
					<a href="https://web-tolk.ru" target="_blank" id="web_tolk_link" title="Go to https://web-tolk.ru">
							<svg width="200" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
								 <g>
								  <title>Go to https://web-tolk.ru</title>
								  <text font-weight="bold" xml:space="preserve" text-anchor="start" font-family="Helvetica, Arial, sans-serif" font-size="32" id="svg_3" y="36.085949" x="8.152073" stroke-opacity="null" stroke-width="0" stroke="#000" fill="#0fa2e6">Web</text>
								  <text font-weight="bold" xml:space="preserve" text-anchor="start" font-family="Helvetica, Arial, sans-serif" font-size="32" id="svg_4" y="36.081862" x="74.239105" stroke-opacity="null" stroke-width="0" stroke="#000" fill="#384148">Tolk</text>
								 </g>
							</svg>
				</a>
				</div>
				<div class="col-10">
					<div class="card-header bg-white p-1">
						<span class="badge bg-success">v.' . $wt_plugin_info->version . '</span>
					</div>
					<div class="card-body">
						' . Text::_("PLG_".strtoupper($element)."_DESC") . '
					</div>
				</div>
			</div>
		</div><div>
		';
    }

    /**
     * Method to get the field title.
     *
     * @return  string  The field title.
     *
     * @since   1.7.0
     */
    protected function getTitle(): string
    {
        return $this->getLabel();
    }
}
?>