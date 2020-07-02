/**
 * @module M/plugin/ReferenceLocatorCatastro
 */
import 'assets/css/referencelocatorcatastro';
import ReferenceLocatorCatastroControl from './referencelocatorcatastrocontrol';
import api from '../../api';

export default class ReferenceLocatorCatastro extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(userParameters) {
    if (M.utils.isNullOrEmpty(userParameters)) {
      M.exception('No ha especificado ningún parámetro.');
    }
    super();

    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Optional WMS Catastro Layer
     * @private
     * @type {M.Layer.WMS}
     */
    this.catastroLayer_ = null;

    /**
     * RCCOOR_url
     * @private
     * @type {String}
     */
    const defectRCCOOR = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR';
    this.RCCOOR_url = userParameters.RCCOOR_url != null ? userParameters.RCCOOR_url : defectRCCOOR;


    /**
     * CMC_url
     * @private
     * @type {String}
     */
    const defectCMC = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/ConsultaMunicipioCodigos';
    this.CMC_url = userParameters.CMC_url != null ? userParameters.CMC_url : defectCMC;

    /**
     * DNPRC_url
     * @private
     * @type {String}
     */
    const defectDNPRC = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPRC_Codigos';
    this.DNPRC_url = userParameters.DNPRC_url != null ? userParameters.DNPRC_url : defectDNPRC;

    /**
     * CPMRC_url
     * @private
     * @type {String}
     */
    const defectCPMRC = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC';
    this.CPMRC_url = userParameters.CPMRC_url != null ? userParameters.CPMRC_url : defectCPMRC;

    /**
     * DNPPP_url
     * @private
     * @type {String}
     */
    const defectDNPP = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPPP_Codigos';
    this.DNPPP_url = userParameters.DNPPP_url != null ? userParameters.DNPPP_url : defectDNPP;

    /**
     * catastroWMS
     * @private
     * @type {Object}
     */
    this.catastroWMS = userParameters.catastroWMS || {};

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.config_ = {
      RCCOOR_url: this.RCCOOR_url,
      CMC_url: this.CMC_url,
      DNPRC_url: this.DNPRC_url,
      CPMRC_url: this.CPMRC_url,
      DNPPP_url: this.DNPPP_url,
      catastroWMS: this.catastroWMS,
    };
    this.controls_.push(new ReferenceLocatorCatastroControl(this.config_));
    this.map_ = map;
    map.areasContainer.querySelector('.m-top.m-right').classList.add('top-extra');
    this.panel_ = new M.ui.Panel('panelReferenceLocatorCatastro', {
      className: 'm-catastro',
      collapsedButtonClass: 'g-catastropanel-button-closed',
      collapsible: true,
      position: M.ui.position.TL,
      tooltip: 'Búsqueda catastral',
    });
    this.panel_.on(M.evt.ADDED_TO_MAP, (html) => {
      M.utils.enableTouchScroll(html);
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);

    // Capa WMS opcional de Catastro
    if (this.config_.catastroWMS.wms_url && this.config_.catastroWMS.name) {
      this.catastroLayer_ = new M.layer.WMS({
        url: this.config_.catastroWMS.wms_url,
        name: this.config_.catastroWMS.name,
        legend: 'Catastro',
        transparent: true,
        tiled: false,
      });
      this.map_.addWMS(this.catastroLayer_);
    }

    const that = this;
    this.controls_[0].on(M.evt.ADDED_TO_MAP, () => {
      that.fire(M.evt.ADDED_TO_MAP);
    });
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.map_, this.controls_, this.panel_] = [null, null, null];
  }

  /**
   * This function returns the controls instanced in this plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    return this.controls_;
  }

  /**
   * This functions gets results layer
   * @public
   * @function
   * @api
   */
  getResultsLayer() {
    return this.controls_[0].getLayer();
  }

  /**
   * This function returns the controls instanced in this plugin
   *
   * @public
   * @function
   * @api stable
   */
  getWMSCatastroLayer() {
    return (this.catastroLayer_);
  }

  /**
   * @getter
   * @public
   */
  get name() {
    return 'referencelocatorcatastro';
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata_;
  }
}
