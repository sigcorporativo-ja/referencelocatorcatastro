import ReferenceLocatorCatastro from 'facade/referencelocatorcatastro';

const map = M.map({
  container: 'mapjs',
  controls: ['scale', 'scaleline', 'mouse', 'overviewmap', 'panzoombar', 'layerswitcher'],
  wmcfile: ['cdau'],
});

const mp = new ReferenceLocatorCatastro({
  RCCOOR_url: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR',
  CMC_url: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/ConsultaMunicipioCodigos',
  DNPRC_url: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPRC_Codigos',
  CPMRC_url: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC',
  DNPPP_url: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPPP_Codigos',
  catastroWMS: {
    wms_url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
    name: 'Catastro',
  },
  position: 'TL',
});

map.addPlugin(mp);
// map.addPlugin(new M.plugin.Measurebar());

/* Test cases:

Provincia: Almería
Municipio: Adra
Polígono: 1
Parcela: 19

Referencia catastral: 04003A00100019

*/
