import CoordinateProvider from './services/CoordinateProvider.js';
import { renderParkings } from './core/Visualization.js';
/*
Visualization parameters
*/
const cityAreaPath = "data/bologna_city_area.json"; 

var initialLocation = [44.45216343349134, 11.255149841308594];//[44.49381, 11.33875]; // Bologna is latitude=44.49381, longitude=11.33875
var initialCameraLocation = [44.49381, 11.33875];
var squareLength = 100; // 100 meters
var coordProvider = new CoordinateProvider(initialLocation, squareLength);

/*
Map related
*/
L.Map.include({
    'clearShapeLayers': function () {
        this.eachLayer(function (layer) {
            console.log(layer.feature);
            // if it's a shape layer and not a map polygon
            if (!(layer instanceof L.TileLayer) && ((layer instanceof L.Polygon) && (layer instanceof L.Rectangle))) this.removeLayer(layer);
        }, this);
    },
    'redrawShapeLayers': function () {
        this.eachLayer(function (layer) {
            // if it's a shape layer and not a map polygon
            if (!(layer instanceof L.TileLayer) && ((layer instanceof L.Polygon) && (layer instanceof L.Rectangle))) {layer._redraw();}
        }, this);
    }
});
// preferCanvas makes all points render in a canvas, avoiding to create a DOM element for each point, making the rendering faster
var map = L.map('mapid', {preferCanvas: true}).setView(initialCameraLocation, 18);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18}).addTo(map);
map.setZoom(14);
fetch(cityAreaPath).then(response => response.json()).then(loadedData => {
    L.geoJSON(loadedData, {
        "color": "#ff7800",
        "weight": 3,
        "opacity": 0.65
    }).addTo(map);
});

/*
Components
*/
var debugDiv = document.getElementById('debug');
                      
map.on('click', function(e) {
    debugDiv.innerText = "Clicked on: "+e.latlng.lat+", "+e.latlng.lng;
});

const dataFiles = [
    "data/coord_orig_parkings.json",
    "data/usage_percentuals_70_1000_runs.json",
    "data/usage_percentuals_240_1000_runs.json"
];

function intersection(original, simulated){
    var intersectionNumbers = {};
    for(var i = 0; i < original.length; i++)
        for(var j = 0; j < simulated.length; j++)
            for(var k = 0; k < simulated[j].length; k++)
                if(original[i].row == simulated[j][k].row && original[i].column == simulated[j][k].column)
                    if(intersectionNumbers[i] === undefined) intersectionNumbers[i]=1;
                    else intersectionNumbers[i]++;
    return original.filter((item, index)=>intersectionNumbers[index]!== undefined);
    //return original.filter((item, index)=>intersectionNumbers[index]==simulated.length);
}

// fetch all files together
Promise.all(dataFiles.map(url => fetch(url).then(r => r.json()).catch((e)=>{debugDiv.innerText="Error."}))).then(data => {
    var originalParkings = data[0].map(point=>coordProvider.findSquare(point.lat, point.lon));;
    var simulated70parkings = data[1];
    var simulated240parkings = data[2];
    var intersectedParkings = intersection(originalParkings, [simulated70parkings, simulated240parkings]);
    renderParkings(map, coordProvider, originalParkings, "orange", 1.0, "Original Parkings");
    renderParkings(map, coordProvider, simulated70parkings, "blue", 0.6, "Top Parkings: 70");
    renderParkings(map, coordProvider, simulated240parkings, "grey", 0.3, "Top Parkings: 240");
    renderParkings(map, coordProvider, intersectedParkings, "red", 0.9, "Original AND Top Parkings");
})
/*
fetch("data/coord_orig_parkings.json").then((r)=>r.json()).then(response=>{
    var parkings = response.map(point=>coordProvider.findSquare(point.lat, point.lon));
    renderParkings(map, coordProvider, parkings, "orange");
});
fetch("data/usage_percentuals_70.json").then((r)=>r.json()).then(response=>{
    //var parkings = response.map(point=>coordProvider.findSquare(point.lat, point.lon));
    renderParkings(map, coordProvider, response, "grey");
});

fetch("data/usage_percentuals_240.json").then((r)=>r.json()).then(response=>{
    //var parkings = response.map(point=>coordProvider.findSquare(point.lat, point.lon));
    renderParkings(map, coordProvider, response, "black");
});*/