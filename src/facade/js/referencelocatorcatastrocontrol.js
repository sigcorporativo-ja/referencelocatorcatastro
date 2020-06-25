/**
 * @module M/control/ReferenceLocatorCatastroControl
 */

import ReferenceLocatorCatastroImplControl from 'impl/referencelocatorcatastrocontrol';
import template from 'templates/referencelocatorcatastro';
import templateResults from 'templates/results';
import templatePopUp from 'templates/featurepopup';

export default class ReferenceLocatorCatastroControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(parameters) {
    if (M.utils.isUndefined(ReferenceLocatorCatastroImplControl)) {
      M.exception('La implementación usada no puede crear controles ReferenceLocatorCatastroControl.');
    }

    const impl = new ReferenceLocatorCatastroImplControl();
    super(impl, 'ReferenceLocatorCatastro');

    if (parameters) {
      this.options = (parameters || {});
      this.config_ = (parameters || {});
    } else {
      M.exception('ReferenceLocatorCatastroControl: configuración no válida.');
    }

    if (M.utils.isUndefined(this.options.name) || M.utils.isNullOrEmpty(this.options.name)) {
      this.options.name = this.NAME || 'ReferenceLocatorCatastro';
    }

    this.facadeMap_ = null;

    /**
     * Input element for RC
     * @private
     * @type {HTMLElement}
     */
    this.inputRC_ = null;

    /**
     * Select element for Provincias
     * @private
     * @type {HTMLElement}
     */
    this.selectProvincias = null;

    /**
     * Select element for Municipios
     * @private
     * @type {HTMLElement}
     */
    this.selectMunicipios = null;

    /**
     * Input element for Poligono
     * @private
     * @type {HTMLElement}
     */
    this.inputPoligono = null;

    /**
     * Input element for Parcela
     * @private
     * @type {HTMLElement}
     */
    this.inputParcela = null;

    /**
     * Url for "consulta de municipios para una provincia"
     * @private
     * @type {String}
     */
    this.ConsultaMunicipioCodigos_ = this.config_.CMC_url;

    /**
     * Url for "consulta de datos no protegidos para un inmueble por su referencia catastral"
     * @private
     * @type {String}
     */
    this.DNPRC_url_ = this.config_.DNPRC_url;

    /**
     * Url for "consulta de coordenadas por Provincia, Municipio y Referencia Catastral"
     * @private
     * @type {String}
     */
    this.CPMRC_url_ = this.config_.CPMRC_url;

    /**
     * Url for "consulta de datos no protegidos para un inmueble por su polígono parcela"
     * @private
     * @type {String}
     */
    this.DNPPP_url_ = this.config_.DNPPP_url;

    /**
     * Url for "consulta de Referencia Catastral por Coordenadas"
     * @private
     * @type {String}
     */
    this.RCCOOR_url_ = this.config_.RCCOOR_url;

    /**
     * Container of the results
     * @private
     * @type {HTMLElement}
     */
    this.resultsRCContainer_ = null;

    /**
     * Container of the results
     * @private
     * @type {HTMLElement}
     */
    this.resultsParamsContainer_ = null;

    /**
     * Container of the results to scroll
     * @private
     * @type {HTMLElement}
     */
    this.resultsScrollContainer_ = null;

    /**
     * Searching result
     * @private
     * @type {HTMLElement}
     */
    this.searchingRCResult_ = null;

    /**
     * Searching result
     * @private
     * @type {HTMLElement}
     */
    this.searchingParamsResult_ = null;

    /**
     * Timestamp of the search to abort old requests
     * @private
     * @type {Nunber}
     */
    this.searchTime_ = 0;

    /**
     * Results of the search
     * @private
     * @type {Array<Object>}
     */
    this.rcResults_ = [];

    /**
     * Results of the search
     * @private
     * @type {Array<Object>}
     */
    this.paramsResults_ = [];

    /**
     * Flag that indicates the scroll is up
     * @private
     * @type {Boolean}
     */
    this.scrollIsUp_ = true;

    /**
     * Draggable panel to show results
     * @private
     * @type {Object}
     */
    this.draggablePanel = null;

    /**
     * Indicates if the panel is minimized
     * @private
     * @type {Boolean}
     */
    this.panelMinimized = false;

    /**
     * Main control's html element
     * @private
     * @type {HTMLElement}
     */
    this.element_ = null;

    /**
     * Name of searching css class
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    this.SEARCHING_CLASS = 'm-searching';

    /**
     * Name of hidden css class
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    this.HIDDEN_RESULTS_CLASS = 'hidden';

    /**
     * Title for the popup
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    this.POPUP_TITLE = 'Información catastral';

    /**
     * Result's layer. Invisible on TOC.
     * @private
     * @type {M.layer}
     */
    this.layer_ = new M.layer.GeoJSON({ name: 'Localizador Catastral', crs: '25830' });
  }

  /**
   * This function adds events listeners to html elements
   *
   * @public
   * @function
   * @param {HTMLElement} element
   * @api stable
   */
  addEvents_(html) {
    this.element_ = html;

    this.resultsRCContainer_ = this.element_.querySelector('div#m-searchRC-results');
    this.searchingRCResult_ = this.element_.querySelector('div#m-searchRC-results > div#m-searching-result-searchRC');
    this.resultsParamsContainer_ = this.element_.querySelector('div#m-searchParams-results');
    this.searchingParamsResult_ = this.element_.querySelector('div#m-searchParams-results > div#m-searching-result-searchParams');
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.facadeMap_ = map;
    this.facadeMap_.addLayers(this.layer_);
    this.layer_.displayInLayerSwitcher = false;

    return new Promise((success, fail) => {
      const html = M.template.compileSync(template);
      this.setStyle(html, this.options);
      this.element_ = html;
      this.createCatastroPanel();
      this.addEvents_(this.element_);
      this.togglePanel();
      success(html);
    });
  }

  /**
   * This function compiles the template and makes a panel
   *
   * @public
   * @function
   * @api stable
   */
  createCatastroPanel() {
    const searchRCContainer = this.element_.querySelector('div#m-searchRC-container');
    const searchParamsContainer = this.element_.querySelector('div#m-searchParams-container');
    const searchRCResults = this.element_.querySelector('div#m-searchRC-results');
    const searchParamsResults = this.element_.querySelector('div#m-searchParams-results');
    const searchRCTab = this.element_.querySelector('ul#m-tabs-referencelocatorcatastro > li:nth-child(1) > a');
    const searchParamsTab = this.element_.querySelector('ul#m-tabs-referencelocatorcatastro > li:nth-child(2) > a');

    searchRCTab.addEventListener('click', () => {
      if (!searchRCTab.classList.contains('activated')) {
        searchRCTab.classList.add('activated');
        searchParamsTab.classList.remove('activated');
        searchRCContainer.classList.add('show');
        searchRCResults.classList.add('show');
        searchParamsResults.classList.remove('show');
        searchParamsContainer.classList.remove('show');
      }
    });

    searchParamsTab.addEventListener('click', () => {
      if (!searchParamsTab.classList.contains('activated')) {
        searchParamsTab.classList.add('activated');
        searchRCTab.classList.remove('activated');
        searchRCContainer.classList.remove('show');
        searchRCResults.classList.remove('show');
        searchParamsResults.classList.add('show');
        searchParamsContainer.classList.add('show');
      }
    });

    this.inputRC_ = this.element_.querySelector('#m-searchRC-input');
    this.inputRC_.addEventListener('keyup', this.onRCSearch.bind(this));

    const catstroSearch = this.element_.querySelector('#m-referencelocatorcatastro-button');
    catstroSearch.addEventListener('click', this.activeSearch.bind(this));

    const castastroInfo = this.element_.querySelector('#m-catastrogetinfo-button');
    castastroInfo.addEventListener('click', this.activeInfo.bind(this));

    const buttonClear = this.element_.querySelector('#m-catastroclear-button');
    buttonClear.addEventListener('click', this.clearResults.bind(this));

    this.selectProvincias = this.element_.querySelector('#m-searchParamsProvincia-select');
    this.selectProvincias.addEventListener('change', this.onProvinciaSelect.bind(this));

    this.selectMunicipios = this.element_.querySelector('#m-searchParamsMunicipio-select');
    this.inputPoligono = this.element_.querySelector('#m-searchParamsPoligono-input');
    this.inputParcela = this.element_.querySelector('#m-searchParamsParcela-input');

    const buttonRCSearch = this.element_.querySelector('#m-searchRC-button');
    buttonRCSearch.addEventListener('click', this.onRCSearch.bind(this));

    const buttonParamsSearch = this.element_.querySelector('#m-searchParams-button');
    buttonParamsSearch.addEventListener('click', e => this.onParamsSearch(e));

    const buttonClearRC = this.element_.querySelector('#m-clearRC-button');
    buttonClearRC.addEventListener('click', this.clearResults.bind(this));

    const buttonClearParams = this.element_.querySelector('#m-clearParams-button');
    buttonClearParams.addEventListener('click', this.clearResults.bind(this));
  }

  /**
   * This function sets user defined style options to button
   *
   * @public
   * @function
   * @api stable
   */
  setStyle(html, options) {
    if (!M.utils.isUndefined(options.tooltip) && !M.utils.isNullOrEmpty(options.tooltip)) {
      html.querySelector('button').setAttribute('title', options.tooltip);
    }
    if (!M.utils.isUndefined(options.icon) && !M.utils.isNullOrEmpty(options.icon)) {
      html.querySelector('button').setAttribute('class', options.icon);
    }
    if (!M.utils.isUndefined(options.order) && !M.utils.isNullOrEmpty(options.order)) {
      html.querySelector('button').parentNode.setAttribute('style', `order: ${options.order}`);
    }
  }

  /**
   * Set search control active
   *
   * @public
   * @function
   * @api stable
   */
  activeSearch() {
    this.deactivate();
    this.togglePanel();
    const classList = this.element_.querySelector('#m-referencelocatorcatastro-button').classList;
    if (classList.contains('activated')) {
      classList.remove('activated');
    } else {
      classList.add('activated');
    }
  }

  /**
   * Set catastro info button active
   *
   * @public
   * @function
   * @api stable
   */
  activeInfo() {
    if (this.panelMinimized === false) {
      this.togglePanel();
    }
    this.activate();
  }

  /**
   * This function adds clear and close events listener to element
   *
   * @public
   * @function
   * @param {HTMLElement} element
   * @api stable
   * @export
   */
  addClearEvents(element) {
    this.on(M.evt.COMPLETED, () => {
      element.classList.add('shown');
    });

    const buttonClearRC = element.querySelector('#m-clearRC-button');
    buttonClearRC.addEventListener('click', this.clearResults.bind(this));

    const buttonClearParams = element.querySelector('#m-clearParams-button');
    buttonClearParams.addEventListener('click', this.clearResults.bind(this));

    const buttonClose = element.querySelector('#dialog-close-catastro');
    buttonClose.addEventListener('click', this.clearResults.bind(this));
  }

  /**
   * This function clears selects, inputs and result info from panel
   *
   * @public
   * @function
   * @api stable
   */
  clearResults() {
    this.clearClick_();
  }

  /**
   * This function builds the query URL and shows results
   *
   * @private
   * @function
   * @param {ol.MapBrowserPointerEvent} evt - Browser point event
   */
  buildUrl_(evt) {
    const options = {
      jsonp: true,
    };

    const srs = this.facadeMap_.getProjection().code;

    M.remote.get(this.RCCOOR_url_, {
      SRS: srs,
      Coordenada_X: evt.coord[0],
      Coordenada_Y: evt.coord[1],
    }).then((res) => {
      this.showInfoFromURL_(res, evt.coord);
    }, options);
  }

  /**
   * This function displays information in a popup
   *
   * @private
   * @function
   * @param {XML} response - response from the petition
   * @param {array} coordinate - Coordinate position onClick
   */
  showInfoFromURL_(response, coordinates) {
    // TODO: Si existe una capa KML en el punto donde se ha pinchado, no se respetara su popup, ya
    // que las coordenadas del mismo seran las del kml,
    // y es muy probable que no coincidan con las del
    // click, ya que para kmls se trabaja con un margen amplio de pixeles
    if ((response.code === 200) && (response.error === false)) {
      const infos = [];
      const info = response.text;
      const formatedInfo = this.formatInfo_(info);
      infos.push(formatedInfo);

      const tab = {
        icon: 'g-cartografia-pin',
        title: this.POPUP_TITLE,
        content: infos.join(''),
      };

      let popup = this.facadeMap_.getPopup();

      if (M.utils.isNullOrEmpty(popup)) {
        popup = new M.Popup();
        popup.addTab(tab);
        this.facadeMap_.addPopup(popup, coordinates);
      } else if (popup.getCoordinate()[0] === coordinates[0] && popup.getCoordinate()[1] === coordinates[1]) {
        // Si es un popup que está en la misma coordenada
        // Vemos si tiene pestañas de otros controles
        let hasExternalContent = false;
        popup.getTabs().forEach((t) => {
          if (t.title !== this.POPUP_TITLE) {
            hasExternalContent = true;
          } else {
            popup.removeTab(t);
          }
        });
        if (hasExternalContent) {
          popup.addTab(tab);
        } else {
          // Es del mismo catastro, podemos borrarlo
          popup = new M.Popup();
          popup.addTab(tab);
          this.facadeMap_.addPopup(popup, coordinates);
        }
      } else {
        popup = new M.Popup();
        popup.addTab(tab);
        this.facadeMap_.addPopup(popup, coordinates);
      }
    } else {
      this.facadeMap_.removePopup();
      M.dialog.error('MAPEA: No es posible establecer la conexión con el servidor de Catastro.');
    }
  }

  /**
   * This function formats the response
   *
   * @param {string} info - Information to formatting
   * @returns {string} information - Formatted information
   * @private
   * @function
   */
  formatInfo_(info) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(info, 'text/xml');
    let ldtNode;
    let valuePopup;
    let codProv;
    let codMun;

    const rootElement = xmlDoc.getElementsByTagName('consulta_coordenadas')[0];
    const controlNode = rootElement.getElementsByTagName('control')[0];
    const errorCtlNode = controlNode.getElementsByTagName('cuerr')[0].childNodes[0].nodeValue;
    if (errorCtlNode === '1') {
      const errorNode = rootElement.getElementsByTagName('lerr')[0];
      const errorDesc = errorNode.getElementsByTagName('err')[0];
      const errorDescTxt = errorDesc.getElementsByTagName('des')[0].childNodes[0].nodeValue;
      valuePopup = errorDescTxt;
    } else {
      const coordenadasNode = rootElement.getElementsByTagName('coordenadas')[0];
      const coordNode = coordenadasNode.getElementsByTagName('coord')[0];
      const pcNode = coordNode.getElementsByTagName('pc')[0];
      const pc1Node = pcNode.getElementsByTagName('pc1')[0].childNodes[0].nodeValue;
      const pc2Node = coordNode.getElementsByTagName('pc2')[0].childNodes[0].nodeValue;

      // Obtenemos códigos de provincia y municipio
      codProv = pc1Node.substring(0, 2);
      codMun = pc1Node.substring(2, 5);

      ldtNode = coordNode.getElementsByTagName('ldt')[0].childNodes[0].nodeValue;
      valuePopup = pc1Node + pc2Node;
    }

    // Sacar a variable la url
    const link = `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?UrbRus=&RefC=${valuePopup}&esBice=&RCBice1=&RCBice2=&DenoBice=&from=OVCBusqueda&pest=rc&RCCompleta=${valuePopup}&final=&del=${codProv}&mun=${codMun}`;

    const formatedInfo = `${M.utils.beautifyAttribute('Información Catastral')}
    <div class='divinfo'>
    <table class='mapea-table'>
    <tbody>
    <tr><td class='header' colspan='4'></td></tr>
    <tr><td class='key'><b>${M.utils.beautifyAttribute('Referencia catastral')}</b></td><td class='value'></b>
    <a href='${link}' target='_blank'>${valuePopup}</a></td></tr>
    <tr><td class='key'><b>${M.utils.beautifyAttribute('Descripción')}</b></td>
    <td class='value'>${ldtNode}</td></tr>
    </tbody></table></div>`;

    return formatedInfo;
  }

  /**
   * Toggle panel
   *
   * @public
   * @function
   * @api stable
   */
  togglePanel() {
    const panelContent = this.element_.querySelector('.m-tabs-referencelocatorcatastro-container');
    if (this.panelMinimized === false) {
      this.panelMinimized = true;
      panelContent.style.display = 'none';
    } else {
      this.panelMinimized = false;
      panelContent.style.display = 'inline';
    }
  }

  /**
   * Handler for search with RC button
   *
   * @public
   * @function
   * @api stable
   */
  onRCSearch(evt) {
    evt.preventDefault();
    if ((evt.type !== 'keyup') || (evt.keyCode === 13)) {
      let inputRC = this.inputRC_ && this.inputRC_.value;
      if (M.utils.isNullOrEmpty(inputRC)) {
        M.dialog.info('Debe introducir una referencia catastral');
      } else {
        inputRC = inputRC.substr(0, 14);
        const searchUrl = M.utils.addParameters(this.CPMRC_url_, {
          Provincia: '',
          Municipio: '',
          SRS: this.facadeMap_.getProjection().code,
          RC: inputRC,
        });
        this.search_(searchUrl, this.resultsRCContainer_, this.searchingRCResult_, this.showResults_);
      }
    }
  }

  /**
   * Handler for search with params button
   *
   * @public
   * @function
   * @api stable
   */
  onParamsSearch(evt) {
    evt.preventDefault();

    if ((evt.type !== 'keyup') || (evt.keyCode === 13)) {
      if (M.utils.isNullOrEmpty(this.selectProvincias.value) || this.selectProvincias.value === '0') {
        M.dialog.info('Debe seleccionar una provincia.');
        return;
      }
      if (M.utils.isNullOrEmpty(this.selectMunicipios.value) || this.selectMunicipios.value === '0') {
        M.dialog.info('Debe seleccionar un municpio.');
        return;
      }
      if (M.utils.isNullOrEmpty(this.inputPoligono.value)) {
        M.dialog.info('Debe introducir un polígono.');
        return;
      }
      if (M.utils.isNullOrEmpty(this.inputParcela.value)) {
        M.dialog.info('Debe introducir una parcela.');
        return;
      }

      const searchUrl = M.utils.addParameters(this.DNPPP_url_, {
        CodigoProvincia: this.selectProvincias.value,
        CodigoMunicipio: this.selectMunicipios.value,
        CodigoMunicipioINE: '',
        Poligono: this.inputPoligono.value,
        Parcela: this.inputParcela.value,
      });
      this.search_(searchUrl, this.resultsParamsContainer_, this.searchingParamsResult_, this.showResults_);
    }
  }

  /**
   * Does the GET petition to search
   *
   * @private
   * @function
   */
  search_(searchUrl, container, searchingResult, processor) {
    container.appendChild(searchingResult);
    this.element_.classList.add(this.SEARCHING_CLASS);

    M.remote.get(searchUrl).then((response) => {
      const success = this.acceptOVCSW(response);
      if (success) {
        processor.call(this, response.xml, container);
      }
      this.element_.classList.remove(this.SEARCHING_CLASS);
    });
  }

  /**
   * Checks if response is valid
   *
   * @private
   * @function
   */
  acceptOVCSW(response) {
    let success = true;
    try {
      if ((response.code === 200) && (response.error === false)) {
        const results = response.xml;
        const rootElement = results.childNodes[0];
        const controlNode = rootElement.getElementsByTagName('control')[0];
        const errorCtlNode = controlNode.getElementsByTagName('cuerr')[0];
        let cuerr = '0';
        if (errorCtlNode !== undefined) {
          cuerr = errorCtlNode.childNodes[0].nodeValue;
        }
        if (cuerr === '1') {
          const errorNode = rootElement.getElementsByTagName('lerr')[0];
          const errorDesc = errorNode.getElementsByTagName('err')[0];
          const errorDescTxt = errorDesc.getElementsByTagName('des')[0].childNodes[0].nodeValue;
          this.element_.classList.remove(this.SEARCHING_CLASS);
          success = false;
          M.dialog.info(errorDescTxt);
        }
      } else {
        success = false;
        M.dialog.error('MAPEA: No es posible establecer la conexión con el servidor de Catastro.');
      }
    } catch (err) {
      success = false;
      M.exception(`La respuesta no es un JSON válido: ${err}.`);
    }
    return success;
  }

  /**
   * Parses CPMRC results
   *
   * @private
   * @function
   */
  parseCPMRCResults(xmlResults) {
    const rootElement = xmlResults.getElementsByTagName('consulta_coordenadas')[0];
    const coordenadasNode = rootElement.getElementsByTagName('coordenadas')[0];
    const coordNode = coordenadasNode.getElementsByTagName('coord')[0];

    const pcNode = coordNode.getElementsByTagName('pc')[0];
    const pc1Node = pcNode.getElementsByTagName('pc1')[0].childNodes[0].nodeValue;
    const pc2Node = pcNode.getElementsByTagName('pc2')[0].childNodes[0].nodeValue;

    const geoNode = coordNode.getElementsByTagName('geo')[0];
    const xcenNode = geoNode.getElementsByTagName('xcen')[0].childNodes[0].nodeValue;
    const ycenNode = geoNode.getElementsByTagName('ycen')[0].childNodes[0].nodeValue;
    const srsNode = geoNode.getElementsByTagName('srs')[0].childNodes[0].nodeValue;

    const ldtNode = coordNode.getElementsByTagName('ldt')[0].childNodes[0].nodeValue;

    return {
      attributes: [{
        key: 'Referencia Catastral',
        value: pc1Node + pc2Node,
      }, {
        key: 'Descripción',
        value: ldtNode,
      }],
      rcId: `rc_${pc1Node}${pc2Node}`,
      coords: [{
        xcen: xcenNode,
        ycen: ycenNode,
        srs: srsNode,
      }],
    };
  }

  /**
   * This function parses results and compiles template
   * with vars to show results
   *
   * @private
   * @function
   */
  showResults_(results, container) {
    this.getLayer().clear();

    let resultsTemplateVars = {};
    if (container === this.resultsRCContainer_) {
      resultsTemplateVars = this.parseRCResultsForTemplate_(results, false);
    } else if (container === this.resultsParamsContainer_) {
      resultsTemplateVars = this.parseParamsResultsForTemplate_(results, false);
      // this.parseParamsResultsForTemplate_(results, false).then((res) => {
      //   resultsTemplateVars = res;
      // });
    }

    Promise.resolve(resultsTemplateVars).then((resultTemplate) => {
      this.drawResults(resultTemplate);
      const html = M.template.compileSync(templateResults, { vars: resultTemplate });
      container.classList.remove(this.HIDDEN_RESULTS_CLASS);
      let resultsHtmlElements = container.querySelectorAll('.result');
      let resultHtml;
      for (let i = 0, ilen = resultsHtmlElements.length; i < ilen; i += 1) {
        resultHtml = resultsHtmlElements.item(i);
        resultHtml.removeEventListener('click', this.resultClick_);
      }

      this.zoomToResults();

      const btnResults = container.querySelector('div.page > div.g-cartografia-flecha-arriba');
      if (!M.utils.isNullOrEmpty(btnResults)) {
        btnResults.removeEventListener('click', this.resultsClick_);
      }

      // gets the new results scroll
      // eslint-disable-next-line no-param-reassign
      container.innerHTML = html.innerHTML;
      this.resultsScrollContainer_ = container.querySelector('div#m-catastro-results-scroll');
      this.resultsScrollContainer_.scrollIntoView(false);
      // adds new events
      resultsHtmlElements = container.getElementsByClassName('result');
      for (let i = 0, ilen = resultsHtmlElements.length; i < ilen; i += 1) {
        resultHtml = resultsHtmlElements.item(i);
        resultHtml.addEventListener('click', this.resultClick_);
      }
      this.fire(M.evt.COMPLETED);
    });
  }

  /**
   * This function parses results from RC search for template
   *
   * @private
   * @function
   */
  parseRCResultsForTemplate_(results, append) {
    const docs = this.parseCPMRCResults(results);
    if (append === true) {
      this.rcResults_.unshift(docs);
    } else {
      this.rcResults_ = [docs];
    }

    return {
      docs: this.rcResults_,
      total: this.rcResults_.length,
      partial: false,
      notResutls: false,
      query: this.inputRC_.value,
    };
  }

  /**
   * This function parses results from params search for template
   *
   * @private
   * @function
   */
  parseParamsResultsForTemplate_(results, append) {
    const rootElement = results.getElementsByTagName('consulta_dnp')[0];
    let descripcion = 'N/A';
    let rcNode;
    let cnValue = 'UR';
    const lrcdnpNode = rootElement.getElementsByTagName('lrcdnp');

    if (lrcdnpNode.length > 0) {
      const rcdnpNode = lrcdnpNode[0].getElementsByTagName('rcdnp')[0];
      rcNode = rcdnpNode.getElementsByTagName('rc')[0];
      const dtNode = rcdnpNode.getElementsByTagName('dt')[0];
      const npNode = dtNode.getElementsByTagName('np')[0].childNodes[0].nodeValue;
      const nmNode = dtNode.getElementsByTagName('nm')[0].childNodes[0].nodeValue;
      const locsNode = dtNode.getElementsByTagName('locs')[0];
      const lorsNode = locsNode.getElementsByTagName('lors')[0];
      const lorusNode = lorsNode.getElementsByTagName('lorus')[0];
      const npaNode = lorusNode.getElementsByTagName('npa')[0].childNodes[0].nodeValue;
      const cpajNode = lorusNode.getElementsByTagName('cpaj')[0].childNodes[0].nodeValue;
      descripcion = `${npaNode} ${cpajNode}. ${nmNode} (${npNode})`;
    } else {
      const bicoNode = rootElement.getElementsByTagName('bico')[0];
      const biNode = bicoNode.getElementsByTagName('bi')[0];
      const idbiNode = biNode.getElementsByTagName('idbi')[0];
      cnValue = idbiNode.getElementsByTagName('cn')[0].childNodes[0].nodeValue;
      rcNode = idbiNode.getElementsByTagName('rc')[0];
      descripcion = biNode.getElementsByTagName('ldt')[0].childNodes[0].nodeValue;
    }

    const pc1Value = rcNode.getElementsByTagName('pc1')[0].childNodes[0].nodeValue;
    const pc2Value = rcNode.getElementsByTagName('pc2')[0].childNodes[0].nodeValue;
    const paramsId = this.selectProvincias.value + this.selectMunicipios.value + this.inputPoligono.value + this.inputParcela.value;
    const searchUrl = M.utils.addParameters(this.CPMRC_url_, {
      Provincia: '',
      Municipio: '',
      SRS: this.facadeMap_.getProjection().code,
      RC: pc1Value + pc2Value,
    });

    return M.remote.get(searchUrl).then((response) => {
      const success = this.acceptOVCSW(response);
      if (success) {
        const docsRC = this.parseCPMRCResults(response.xml);
        const xcen = docsRC.coords[0].xcen;
        const ycen = docsRC.coords[0].ycen;
        const srs = docsRC.coords[0].srs;
        const docs = {
          attributes: [{
            key: 'Referencia Catastral',
            value: pc1Value + pc2Value,
          }, {
            key: 'Descripción',
            value: descripcion,
          }, {
            key: 'Tipo',
            value: cnValue,
          }],
          paramsId,
          rcId: `rc_${pc1Value}${pc2Value}`,
          coords: [{
            xcen,
            ycen,
            srs,
          }],
        };
        if (append === true) {
          this.paramsResults_.unshift(docs);
        } else {
          this.paramsResults_ = [docs];
        }

        return {
          docs: this.paramsResults_,
          total: this.paramsResults_.length,
          partial: false,
          notResutls: false,
          query: pc1Value + pc2Value,
        };
      }
      return 'Unsuccessful response.';
    });
  }

  /**
   * Result button click handler
   *
   * @private
   * @function
   */
  resultClick_(evt) {
    evt.preventDefault();
    // hidden results on click for mobile devices
    if (M.window.WIDTH <= M.config.MOBILE_WIDTH) {
      // TODO?
      // evt.target = this.facadeMap_.getContainer()
      // .querySelector('div.page > div.g-cartografia-flecha-arriba');
      // this.resultsClick_(evt);
    }
    this.facadeMap_.removePopup();
    const rcId = evt.currentTarget.id;
    this.resultClick(rcId);
  }

  /**
   * Clear button click handler
   * Clears selects, inputs and result info from panel.
   *
   * @private
   * @function
   */
  clearClick_() {
    this.element_.classList.remove('shown');

    if (!M.utils.isNullOrEmpty(this.inputRC_)) {
      this.inputRC_.value = '';
    }
    if (!M.utils.isNullOrEmpty(this.selectProvincias)) {
      this.selectProvincias.value = '0';
    }
    if (!M.utils.isNullOrEmpty(this.selectMunicipios)) {
      this.selectMunicipios.value = '0';
    }
    if (!M.utils.isNullOrEmpty(this.inputPoligono)) {
      this.inputPoligono.value = '';
    }
    if (!M.utils.isNullOrEmpty(this.inputParcela)) {
      this.inputParcela.value = '';
    }
    if (!M.utils.isNullOrEmpty(this.resultsRCContainer_)) {
      this.resultsRCContainer_.innerHTML = '';
    }
    if (!M.utils.isNullOrEmpty(this.resultsParamsContainer_)) {
      this.resultsParamsContainer_.innerHTML = '';
    }
    if (!M.utils.isNullOrEmpty(this.resultsScrollContainer_)) {
      this.resultsScrollContainer_.innerHTML = '';
      this.resultsScrollContainer_ = null;
    }
    if (!M.utils.isNullOrEmpty(this.rcResults_)) {
      this.rcResults_.length = 0;
    } else {
      this.rcResults_ = [];
    }
    if (!M.utils.isNullOrEmpty(this.paramsResults_)) {
      this.paramsResults_.length = 0;
    } else {
      this.paramsResults_ = [];
    }

    this.resultsRCContainer_.classList.remove(this.HIDDEN_RESULTS_CLASS);
    this.resultsParamsContainer_.classList.remove(this.HIDDEN_RESULTS_CLASS);
    this.clear();
  }

  /**
   * Handler for click on results button
   *
   * @private
   * @function
   */
  resultsClick_(evt) {
    this.facadeMap_.areasContainer.getElementsByClassName('m-top m-right')[0].classList.add('top-extra-search');
    evt.target.classlist.toggle('g-cartografia-flecha-arriba');
    evt.target.classlist.toggle('g-cartografia-flecha-abajo');
    this.resultsRCContainer_.classlist.toggle(this.HIDDEN_RESULTS_CLASS);
    this.resultsParamsContainer_.classlist.toggle(this.HIDDEN_RESULTS_CLASS);
  }

  /**
   * Handler for selecting an option on Provincia select
   *
   * @public
   * @function
   * @api stable
   */
  onProvinciaSelect(e) {
    const elt = e.target;
    const provinceCode = elt.value;
    if (provinceCode !== '0') {
      M.remote.get(this.ConsultaMunicipioCodigos_, {
        CodigoProvincia: provinceCode,
        CodigoMunicipio: '',
        CodigoMunicipioIne: '',
      }).then((res) => {
        this.loadMunicipiosSelect(res);
      });
    } else {
      this.clearMunicipiosSelect();
    }
  }

  /**
   * Clears options set to Municipios select
   *
   * @public
   * @function
   * @api stable
   */
  clearMunicipiosSelect() {
    const select = this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'];
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
    const option = document.createElement('option');
    option.value = '0';
    option.innerHTML = 'Seleccione un municipio';
    select.appendChild(option);
  }

  /**
   * Loads and renders options set to Municipios select
   *
   * @public
   * @function
   * @api stable
   */
  loadMunicipiosSelect(response) {
    if ((response.code === 200) && (response.error === false)) {
      const rootElement = response.xml.getElementsByTagName('consulta_municipiero')[0];
      const rootMunicipios = rootElement.getElementsByTagName('municipiero')[0];
      const muniNodes = rootMunicipios.getElementsByTagName('muni');
      const select = this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'];
      this.clearMunicipiosSelect();
      for (let i = 0; i < muniNodes.length; i += 1) {
        const option = document.createElement('option');
        const locat = muniNodes[i].getElementsByTagName('locat')[0];
        option.value = locat.getElementsByTagName('cmc')[0].childNodes[0].nodeValue;
        option.innerHTML = muniNodes[i].getElementsByTagName('nm')[0].childNodes[0].nodeValue;
        select.appendChild(option);
      }
    } else {
      M.dialog.error('MAPEA: No es posible establecer la conexión con el servidor de Catastro.');
    }
  }

  /**
   * This function draws the results into the specified map
   *
   * @public
   * @function
   * @param {Array<Object>} results to draw
   * @api stable
   */
  drawResults(results) {
    let docs = [];

    if (M.utils.isNullOrEmpty(docs)) {
      docs = results.docs;
    }

    const features = docs.map((doc) => {
      const xcenNode = doc.coords[0].xcen;
      const ycenNode = doc.coords[0].ycen;

      const attributes = {};
      doc.attributes.forEach((element) => {
        attributes[element.key] = element.value;
      });
      const feature = new M.Feature(doc.rcId, {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [xcenNode, ycenNode],
        },
        properties: attributes,
      });

      return feature;
    }, this);
    // TODO: Aplicar estilo a capa Catastro? se puede cambiar desde fuera
    this.layer_.addFeatures(features);
  }

  /**
   * This function zooms the view to the results on layer
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  zoomToResults() {
    const bbox = this.layer_.getFeaturesExtent();

    this.facadeMap_.removePopup();
    this.facadeMap_.setBbox(bbox);
  }

  /**
   * This function returns the layer used
   *
   * @public
   * @function
   * @returns {ol.layer.Vector}
   * @api stable
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * TODO
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  resultClick(rcid) {
    const feature = this.layer_.getFeatureById(rcid);
    this.selectedFeatures_ = [feature];

    const featureGeom = feature.getGeometry();
    const coord = featureGeom.coordinates;

    this.unselectResults();
    this.selectFeatures([feature], coord, true);

    this.facadeMap_.setCenter(coord);
    this.facadeMap_.setZoom(15);
  }

  /**
   * This function clears the layer
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  clear() {
    this.facadeMap_.removePopup();
    this.layer_.clear();
  }

  /**
   * This function checks if an object is equals
   * to this layer
   * @public
   * @function
   * @param {ol.Feature} feature
   * @api stable
   */
  selectFeatures(features, coord, noPanMapIfOutOfView) {
    // unselects previous features
    this.unselectResults();

    // sets the style
    this.selectedFeatures_ = features;

    const featureForTemplate = this.parseFeaturesForTemplate_(features);
    const htmlAsText = M.template.compileSync(templatePopUp, {
      jsonp: false,
      vars: featureForTemplate,
      parseToHtml: false,
    });
    const featureTabOpts = {
      icon: 'g-cartografia-pin',
      title: this.POPUP_TITLE,
      content: htmlAsText,
    };
    let popup = this.facadeMap_.getPopup();
    if (M.utils.isNullOrEmpty(popup)) {
      popup = new M.Popup({
        panMapIfOutOfView: !noPanMapIfOutOfView,
        ani: null,
      });
      popup.addTab(featureTabOpts);
      this.facadeMap_.addPopup(popup, coord);
    } else {
      popup.addTab(featureTabOpts);
    }
    // removes events on destroy
    popup.on(M.evt.DESTROY, () => {
      this.unselectResults(true);
    }, this);
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @private
   * @function
   */
  parseFeaturesForTemplate_(features) {
    const featuresTemplate = {
      features: [],
    };

    features.forEach((feature) => {
      const attributes = [];
      const properties = feature.getAttributes();
      properties.forEach((element, key) => {
        attributes.push({ key, value: properties[key] });
      });
      // Old code:
      // for (const key in properties) {
      //   attributes.push({ key, value: properties[key] });
      // }
      const featureTemplate = {
        attributes,
      };
      featuresTemplate.features.push(featureTemplate);
    });
    return featuresTemplate;
  }

  /**
   * TODO
   *
   * @public
   * @function
   * @param {boolean} keepPopup to draw
   * @api stable
   */
  unselectResults(keepPopup) {
    if (this.selectedFeatures_.length > 0) {
      this.selectedFeatures_.length = 0;
      // removes the popup just when event destroy was not fired
      if (!keepPopup) {
        this.facadeMap_.removePopup();
      }
    }
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    if (this.activated) {
      this.deactivate();
    } else {
      let someCtlActive = false;
      const controls = this.facadeMap_.getControls();
      // TODO: check if this should be: someCtlActive = controls.some(...)
      controls.some((control) => {
        if (control.activated === true && !(control instanceof this)) {
          M.dialog.info(`Desactive el control ${control.name} antes de activar este.`);
          someCtlActive = true;
        }
        return someCtlActive;
      });

      if (someCtlActive === false) {
        this.facadeMap_.on(M.evt.CLICK, this.buildUrl_, this);
        this.activated = true;
        this.element_.querySelector('#m-catastrogetinfo-button').classList.add('activated');
        this.element_.querySelector('#m-referencelocatorcatastro-button').classList.remove('activated');
      } else {
        this.activated = false;
      }
    }
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.facadeMap_.removePopup();
    this.facadeMap_.un(M.evt.CLICK, this.buildUrl_, this);
    this.activated = false;
    this.element_.querySelector('#m-catastrogetinfo-button').classList.remove('activated');
  }
  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api stable
   */
  getActivationButton(html) {
    return html.querySelector('.m-referencelocatorcatastro button');
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof ReferenceLocatorCatastroControl) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.clear();
    this.facadeMap_.areasContainer.querySelector('.m-top.m-right').classList.remove('top-extra');
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
    this.layer_ = null;
  }
}
