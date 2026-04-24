/**
 * Highcharts with required modules (polar/radar, sankey) registered.
 * Side-effect imports register the modules with Highcharts.
 */
import Highcharts from "highcharts";
import "highcharts/highcharts-more";
import "highcharts/modules/sankey";

Highcharts.setOptions({ accessibility: { enabled: false } });

export default Highcharts;
