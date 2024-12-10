

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed'); // Debugging line

    // Function to add click event listeners to SVG objects
    function addClickEventToSVG(svgElement, targetId) {
        svgElement.addEventListener('load', () => {
            const svgDoc = svgElement.contentDocument;
            if (svgDoc) {
                const svgRoot = svgDoc.documentElement;
                svgRoot.addEventListener('click', (event) => {
                    event.preventDefault();
                    console.log(`Navigating to: ${targetId}`); // Debugging line
                    document.querySelectorAll('.page-section').forEach(section => {
                        section.classList.remove('visible');
                    });
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        targetSection.classList.add('visible');
                        targetSection.scrollIntoView({ behavior: 'auto' });
                        // Show the back-to-top button
                        document.getElementById('back-to-top').style.display = 'block';
                    } else {
                        console.error(`Section with ID ${targetId} not found`); // Debugging line
                    }
                });
            } else {
                console.error('SVG content not loaded'); // Debugging line
            }
        });
    }

    // Add click event listeners to all intro-icons
    document.querySelectorAll('.intro-link').forEach(link => {
        const targetId = link.getAttribute('href').substring(1);
        const svgElement = link.querySelector('object');
        if (svgElement) {
            addClickEventToSVG(svgElement, targetId);
        }
    });

    // Add click event to the back-to-top button
    document.getElementById('back-to-top').addEventListener('click', function () {
        // Scroll to the top
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Hide all sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('visible');
        });

        // Show the initial page section
        document.getElementById('IntroPage').classList.add('visible');

        // Hide the button after scrolling to the top
        this.style.display = 'none';
    });
});

//EXPLORE THE COLLECTION BY ORIGIN
const initialWidth = window.innerWidth;
const initialHeight = window.innerHeight;
const bottomMargin = 10; // Margin at the bottom of the map
const width = window.innerWidth;
const height = window.innerHeight;
//const maxRadius = 60; // Set the maximum radius for the circles

const projection = d3.geoMercator()
    .center([0, 0])
    .scale((initialWidth / 2 / Math.PI) * 1.1) // Adjust the scale to fit the full width of the map
    .translate([initialWidth / 2, initialHeight / 2]); // Center the map

const path = d3.geoPath().projection(projection);

const svg = d3.select('#map-container').append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${initialWidth} ${initialHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

// Create groups for map and circles
const mapGroup = svg.append('g').attr('class', 'map').attr('id', 'map-visual');
const circlesGroup = svg.append('g').attr('class', 'circles');

// Define the maximum radius for the circles
const maxRadius = 10; // Set the maximum radius for the circles

const zoom = d3.zoom()
    .scaleExtent([1, 8]) // Set the zoom scale extent
    .on('zoom', (event) => {
        const transform = event.transform;
        mapGroup.attr('transform', transform);
        circlesGroup.attr('transform', transform);

        // Update the circle radius based on the zoom scale
        const sensitivityFactor = 1; // Adjust this factor to increase sensitivity
        circlesGroup.selectAll('circle')
            .attr('r', d => Math.min(maxRadius, 5 / transform.k * sensitivityFactor)); // Adjust the base radius as needed
    });

svg.call(zoom);

function resetMap() {
    // Reset the projection to its initial state
    projection
        .center([0, 0])
        .scale((initialWidth / 2 / Math.PI) * 1.1) // Adjust the scale to fit the full width of the map
        .translate([initialWidth / 2, initialHeight / 2]); // Center the map

    // Update the SVG and map elements
    svg.attr('viewBox', `0 0 ${initialWidth} ${initialHeight}`);
    mapGroup.selectAll('path').attr('d', path);
    updateCircles(data); // Re-render circles with the new projection

    // Reset the zoom
    svg.transition()
        .duration(750)
        .call(
            zoom.transform,
            d3.zoomIdentity.translate(0, 0).scale(1)
        );
}



// Example: Add event listener for navigation back to the main page
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page === 'IntroPage') {
        resetMap;
    }
});

// Example: Add event listener for a specific button click to navigate back to the main page
document.getElementById('back-to-top').addEventListener('click', () => {
    resetMap();
});

// Function to create color filter buttons
function createColorButtons(data) {
    // Define the color mapping object
    const colorMapping = {
        'red': '#e31e24',
        'blue': '#3b4eff',
        'green': '#17b035',
        'yellow': '#fae52a',
        'purple': '#c478ff',
        'orange': '#f58822',
        'pink': '#de4ba8',
        'black': '#000000',
        'white': '#ffffff',
        'brown': '#8b4513',
        'colorless': '#d3f3f1',
        'gray': '#bdbdbd',
    };
    const colorContainer = document.getElementById('color-buttons-container');
    // Add "all colors" button
    const allColorsButton = document.createElement('button');
    allColorsButton.value = 'all';
    allColorsButton.textContent = 'All Colors';
    allColorsButton.style.backgroundColor = '#a2e0dd';
    allColorsButton.style.color = '#000000';
    allColorsButton.style.margin = '5px';
    allColorsButton.style.padding = '5px';
    //allColorsButton.style.border = 'none';
    allColorsButton.style.borderRadius = '5px';
    allColorsButton.addEventListener('click', () => {
        updateCircles(data);

        // Reset the zoom to the initial state
        svg.transition()
            .duration(750)
            .call(
                resetMap
            );

        // Update the info content with the gem count
        d3.select('#info-content').html('Hover over a circle to see details.');

    });
    colorContainer.appendChild(allColorsButton);
    const uniqueColors = [...new Set(data.map(d => d.primaryColor).filter(color => color))];
    uniqueColors.forEach(color => {
        const button = document.createElement('button');
        button.value = color;
        button.textContent = color.charAt(0).toUpperCase() + color.slice(1); // Capitalize the color name
        const backgroundColor = colorMapping[color] || '#abc1c4';
        button.style.backgroundColor = backgroundColor;
        button.style.color = getContrastColor(backgroundColor);
        button.style.margin = '5px';
        button.style.padding = '5px';
        //button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.addEventListener('click', () => {
            const filteredData = filterData(data, color);
            updateCircles(filteredData);

            // Count the number of gems with the selected color
            const gemCount = filteredData.length;
            const gemCountText = `<h3>Number of ${color} gems:</h3> ${gemCount}`;

            // Update the info content with the gem count
            d3.select('#info-content').html(`Hover over a circle to see details.<br>${gemCountText}`);
        });
        colorContainer.appendChild(button);
    });

    function getContrastColor(hexColor) {
        // Convert hex color to RGB
        const rgb = parseInt(hexColor.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;

        // Calculate brightness (YIQ formula)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Return black for light background and white for dark background
        return brightness > 128 ? '#000' : '#fff';
    }
}

// Function to populate the country dropdown with unique countries
function populateCountryDropdown(data) {
    const countryDropdown = document.getElementById('country-dropdown');
    const uniqueCountries = [...new Set(data
        .filter(d => d.lat !== "Unknown" && d.long !== "Unknown" && d.country !== "Unknown") // Filter data points with lat and long not "Unknown"
        .map(d => d.country)
        .filter(country => country)
    )].sort();

    uniqueCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryDropdown.appendChild(option);
    });
}

let data; // Define the data variable in a scope accessible to both renderMap and the resize event listener

// Define the updateCircles function
function updateCircles(data) {

    // Filter out data points with "Unknown" latitude, longitude, or place values
    const filteredData = data.filter(d => d.long !== "Unknown" && d.lat !== "Unknown" && d.place !== "Unknown" && d.country !== "Unknown");

    circlesGroup.selectAll('circle').remove(); // Clear existing circles

    circlesGroup.selectAll('circle')
        .data(filteredData)
        .enter()
        .append('circle')
        .attr('cx', d => {
            const longitude = parseFloat(d.long);
            const latitude = parseFloat(d.lat);
            if (isNaN(longitude) || isNaN(latitude)) {
                console.error(`Invalid data point: long=${d.long}, lat=${d.lat}, place=${d.place}`);
                return null; // Skip this data point if coordinates are invalid
            }
            const coords = projection([longitude, latitude]);
            return coords[0];
        })
        .attr('cy', d => {
            const longitude = parseFloat(d.long);
            const latitude = parseFloat(d.lat);
            if (isNaN(longitude) || isNaN(latitude)) {
                console.error(`Invalid data point: long=${d.long}, lat=${d.lat}, place=${d.place}`);
                return null; // Skip this data point if coordinates are invalid
            }
            const coords = projection([longitude, latitude]);
            return coords[1];
        })
        .attr('r', 5)
        .attr('fill', d => {
            const colorMapping = {
                'red': '#e31e24',
                'blue': '#3172ff',
                'green': '#17b035',
                'yellow': '#fae52a',
                'purple': '#c478ff',
                'orange': '#f58822',
                'pink': '#de4ba8',
                'black': '#000000',
                'white': '#ffffff',
                'brown': '#8b4513',
                'colorless': '#c9d6d6',
                'gray': '#bdbdbd',
            };
            return colorMapping[d.primaryColor] || '#c9d6d6';
        })
        .attr('stroke', '#393939') // Add dark stroke
        .attr('stroke-width', 0.2) // Set stroke width
        .attr('opacity', 0.8) // Set opacity to 80%
        .on('mouseover', (event, d) => {
            console.log(d); // Log the data for the hovered circle
            d3.select('#geo-info-content').html(`
                <g><h3>GEM:</h3>${d.type}<br><br>
                <h3>LOCATION:</h3> ${d.place}<br><br>
                <h3>WEIGHT:</h3> ${d.carat || 'N/A'}<br><br>
                <h3>COLOR:</h3> ${d.color || 'N/A'}<br><br>
            `);
        })
        .on('mouseout', () => {
            d3.select('#geo-info-content').text('Hover over a circle to see details.');
        });

    // Bring circles group to the front
    circlesGroup.raise();

}

// Function to update the viewBox dimensions for the default view
function updateViewBox(data, resetZoom = false) {
    if (resetZoom) {
        // Reset the zoom level to show the entire map
        svg.transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity.translate(0, 0).scale(1)
            );
    } else {
        const minLat = d3.min(data, d => parseFloat(d.lat) - 10);
        const maxLat = d3.max(data, d => parseFloat(d.lat) + 10);
        const minLong = d3.min(data, d => parseFloat(d.long));
        const maxLong = d3.max(data, d => parseFloat(d.long));

        const latDiff = maxLat - minLat;
        const longDiff = maxLong - minLong;

        const centerLat = (minLat + maxLat) / 2;
        const centerLong = (minLong + maxLong) / 2;

        const center = projection([centerLong, centerLat]);
        const viewBoxWidth = Math.abs(projection([maxLong, centerLat])[0] - projection([minLong, centerLat])[0]);
        const viewBoxHeight = Math.abs(projection([centerLong, maxLat])[1] - projection([centerLong, minLat])[1]);
        const centerX = center[0] - viewBoxWidth / 2;
        const centerY = center[1] - viewBoxHeight / 2;

        svg.attr('viewBox', `${centerX} ${centerY} ${viewBoxWidth} ${viewBoxHeight}`);
    }
}
function renderMap() {
    const width = window.innerWidth * 0.75;
    const height = window.innerHeight - bottomMargin;

    d3.json('https://d3js.org/world-110m.v1.json').then(worldData => {
        const countries = topojson.feature(worldData, worldData.objects.countries).features;

        mapGroup.selectAll('path')
            .data(countries)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', '#6f6f6f')
            .attr('stroke', '#333');

        fetch('locationdata.json')
            .then(response => response.json())
            .then(loadedData => {
                data = loadedData;
                console.log(data);

                createColorButtons(data);
                populateCountryDropdown(data);
                updateCircles(data);

                const countryDropdown = document.getElementById('country-dropdown');
                countryDropdown.addEventListener('change', () => {
                    const selectedCountry = countryDropdown.value;
                    const filteredData = filterDataByCountry(data, selectedCountry);
                    updateCircles(filteredData);

                    const gemCount = filteredData.length;
                    const gemCountText = selectedCountry === 'all' ? '' : `<br><h3>Number of gems in ${selectedCountry}:</h3> ${gemCount}`;
                    d3.select('#info-content').html(`Hover over a circle to see details.<br>${gemCountText}`);
                    const countryFilterChartText = selectedCountry === 'all' ? '' : `There are ${gemCount} gems from ${selectedCountry} in the collection.`;
                    d3.select('#country-filter-name').html(countryFilterChartText);

                    if (selectedCountry !== 'all') {
                        d3.select('#country-name').html(`<h2>${selectedCountry.toUpperCase()}</h2>`);
                        const minLat = d3.min(data, d => parseFloat(d.lat) - 10);
                        const maxLat = d3.max(data, d => parseFloat(d.lat) + 10);
                        const minLong = d3.min(data, d => parseFloat(d.long));
                        const maxLong = d3.max(data, d => parseFloat(d.long));

                        const latDiff = maxLat - minLat;
                        const longDiff = maxLong - minLong;

                        const centerLat = (minLat + maxLat) / 2;
                        const centerLong = (minLong + maxLong) / 2;

                        const center = projection([centerLong, centerLat]);
                        const viewBoxWidth = Math.abs(projection([maxLong, centerLat])[0] - projection([minLong, centerLat])[0]);
                        const viewBoxHeight = Math.abs(projection([centerLong, maxLat])[1] - projection([centerLong, minLat])[1]);
                        const centerX = center[0] - viewBoxWidth / 2;
                        const centerY = center[1] - viewBoxHeight / 2;
                        const maxScale = 3;
                        let scale = Math.max(1, Math.min(maxScale, 0.5 / Math.max(latDiff / width, longDiff / height)));
                        svg.transition()
                            .duration(750)
                            .call(
                                zoom.transform,
                                d3.zoomIdentity.translate(0, 0).scale(1)
                            );
                        svg.attr('viewBox', `${centerX} ${centerY} ${viewBoxWidth} ${viewBoxHeight}`);
                    } else if (selectedCountry === 'all') {
                        d3.select('#country-name').html(`<h2> </h2>`);
                        d3.select('#country-filter-chart').html('');
                        svg.transition()
                            .duration(500)
                            .call(
                                resetMap
                            );
                        d3.select()
                        svg.attr("viewBox", `0 0 ${width} ${height}`);
                    }



                    updateViewBox(filteredData);
                    updateBarChart(filteredData, selectedCountry);
                });

                const zoomInButton = document.getElementById('zoom-in');
                const zoomOutButton = document.getElementById('zoom-out');
                const zoomFactor = 1.25;

                zoomInButton.addEventListener('click', () => {
                    zoomMap(zoomFactor);
                });

                zoomOutButton.addEventListener('click', () => {
                    zoomMap(1 / zoomFactor);
                });

                function zoomMap(factor) {
                    const currentScale = projection.scale();
                    const currentTranslate = projection.translate();
                    const newScale = currentScale * factor;

                    const centerX = initialWidth / 2;
                    const centerY = initialHeight / 2;

                    const newTranslate = [
                        centerX - (centerX - currentTranslate[0]) * (newScale / currentScale),
                        centerY - (centerY - currentTranslate[1]) * (newScale / currentScale)
                    ];

                    projection.scale(newScale).translate(newTranslate);
                    mapGroup.selectAll('path').attr('d', path);
                    updateCircles(data);
                }

                function resetMap() {
                    projection
                        .scale((initialWidth / 2 / Math.PI) * 1.1 / zoomFactor)
                        .translate([initialWidth / 2, initialHeight / 2]);
                    mapGroup.selectAll('path').attr('d', path);
                    updateCircles(data);
                }

                window.addEventListener('resize', () => {
                    const newWidth = window.innerWidth;
                    const newHeight = window.innerHeight - bottomMargin;

                    const newTranslate = [400, newHeight / 2];

                    projection
                        .center([0, 0])
                        .scale((initialWidth / 2 / Math.PI) * 1.1 / zoomFactor)
                        .translate([initialWidth / 2, initialHeight / 2]);

                    svg.attr('width', newWidth - 400).attr('height', newHeight);
                    mapGroup.selectAll('path').attr('d', path);
                    updateCircles(data);
                });
            })
            .catch(error => console.error('Error loading the data:', error));
    }).catch(error => console.error('Error loading the world map:', error));
}

function filterData(data, selectedColor) {
    if (selectedColor === 'all') {
        return data;
    }
    return data.filter(d => d.primaryColor === selectedColor);
}

function filterDataByCountry(data, selectedCountry) {
    if (selectedCountry === 'all') {
        return data;
    }
    return data.filter(d => d.country === selectedCountry);
}

function updateBarChart(data, selectedCountry) {
    const svg = d3.select("#country-filter-chart").html("");

    if (selectedCountry === 'all') {
        svg.selectAll("*").remove(); // Clear the SVG content
        return; // Exit the function if "All Countries" is selected
    }

    const gemTypeCounts = d3.rollups(data, v => v.length, d => {
        const match = d.type.match(/\(var\.(.*?)\)/);
        return match ? match[1].toUpperCase() : d.type.toUpperCase();
    })
        .sort((a, b) => d3.descending(a[1], b[1]))
        .slice(0, 5);

    const margin = { top: 40, right: 50, bottom: 30, left: 0 };
    const containerWidth = 400; // Fixed width of the container
    const width = containerWidth - margin.left - margin.right;
    const height = 210 - margin.top - margin.bottom;

    const chartSvg = svg.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    chartSvg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2 - 3)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "white")
        .style("margin-bottom", "10px")
        .text(`Top 5 Types of Gems From ${selectedCountry}`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(gemTypeCounts.map(d => d[0]))
        .padding(.1);

    chartSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("fill", "white");

    const y = d3.scaleLinear()
        .domain([0, d3.max(gemTypeCounts, d => d[1])])
        .range([height + 10, 0]);

    chartSvg.selectAll("myRect")
        .data(gemTypeCounts)
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[1]))
        .attr("fill", "#69b3a2");

    chartSvg.selectAll("myText")
        .data(gemTypeCounts)
        .enter()
        .append("text")
        .attr("x", d => x(d[0]) + x.bandwidth() / 2)
        .attr("y", d => y(d[1]) - 5)
        .attr("text-anchor", "middle")
        .attr("id", "country-filter-label")
        .text(d => d[1]);
}

renderMap();

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth * 0.75;
    const newHeight = window.innerHeight - bottomMargin;

    // Calculate the new scale and translation to fit the map within the window
    const aspectRatio = initialWidth / initialHeight;
    const newAspectRatio = newWidth / newHeight;
    // const newScale = (newWidth / initialWidth) ? newHeight / initialHeight * (initialWidth / 6) : newWidth / initialWidth * (initialWidth / 6);
    const newScale = newWidth / initialWidth * (initialWidth / 6);
    const newTranslate = [newWidth / 2 + 300, newHeight / 2]; // Center the map

    projection
        .translate(newTranslate)
        .scale(newScale);

    // Update the map and circles with the new projection
    svg.attr('width', newWidth).attr('height', newHeight);
    mapGroup.selectAll('path').attr('d', path);
    updateCircles(data); // Re-render circles with the new projection
});




//EXPLORE THE COLLECTION BY COLOR
// Define the wrapText function
function wrapText(text, maxWidth) {
    text.each(function () {
        const text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 3).attr("y", y).attr("dy", dy + "em");

        let word,
            line = [],
            lineNumber = 0;

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > maxWidth) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 3).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}


// Initialize rectanglesVisible variable
let rectanglesVisible = true;
let isSubTreemapVisible = false; // Flag to track if sub-treemap is visible
let currentPrimaryColor = null; // Store the current primary color for sub-treemap
let currentData = null; // Store the current data for sub-treemap

// Define the calculateFontSize function
function calculateFontSize(key, width, height) {
    // Example logic to calculate font size based on rectangle dimensions
    const area = width * height;
    const baseFontSize = 12; // Base font size
    const scaleFactor = Math.sqrt(area) / 50; // Scale factor based on area
    return Math.max(baseFontSize, baseFontSize * scaleFactor);
}

// Define specific colors for specific groups
const colorMapping = {
    "yellow": "#fff700",
    "blue": "#004EE0",
    "green": "#228b22",
    "orange": "#ff7700",
    "purple": "#a200bf",
    "pink": "#fb00d1",
    "red": "#ee0000",
    "black": "#000000",
    "brown": "#874400",
    "white": "#ffffff",
    "gray": "#7e7e7e",
};

// Function to determine if a color is dark
function isColorDark(color) {
    const rgb = d3.color(color).rgb();
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness < 128;
}





// EXPLORE THE COLLECTION BY COLOR
d3.json('locationdata.json').then(data => {
    // Filter out data points with null primaryColor
    const filteredData = data.filter(d => d.primaryColor !== null);

    // Define the specific gem types to include in the dropdown
    const gemTypes = ["All", "diamond", "sapphire", "quartz", "topaz", "pearl", "beryl"];

    const treecontrol = d3.select("#tree-control");
    // Select the treemap div
    const container = d3.select("#treemap");


    // Create a container for the dropdown and back button
    const controlContainer = treecontrol.append("div")
        .style("display", "flex")
        .style("align-items", "left");

    // Create a dropdown menu
    const dropdown = controlContainer.append("select")
        .attr("id", "gem-type-dropdown")
        .style("margin", "10px 2px")
        .style("background-color", "#303030") // Change background color
        .style("font-size", "12px") // Change font size
        .style("color", "#ffffff") // Change text color
        .style("border", "2px solid #ffffff") // Change border
        .style("border-radius", "5px") // Add border radius
        .style("padding", "5px") // Add padding
        .on("change", function () {
            const selectedType = this.value;
            if (isSubTreemapVisible) {
                drawSubTreemap(currentPrimaryColor, currentData, selectedType === "All" ? null : selectedType);
            } else {
                drawTreemap(selectedType === "All" ? null : selectedType);
            }
        });

    // Add options to the dropdown
    dropdown.selectAll("option")
        .data(gemTypes)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1)); // Capitalize the first letter

    // Add back button
    const backButton = controlContainer.append("button")
        .attr("id", "back-button")
        .text("Back")
        .style("display", "none")
        .style("margin", "10px 20px")
        .style("margin-left", "10px") // Add margin to the left of the button
        .on("mouseover", function () {
            backButton.style("background-color", "#cde4e563")
                .style("color", "#ffffff")
                .style("cursor", "pointer")
                .style("border", "2px solid #ffffff");
        })
        .on("mouseout", function () {
            backButton.style("background-color", "#303030")
                .style("color", "#ffffff")
                .style("border", "2px solid #ffffff");
        })
        .on("click", function () {
            isSubTreemapVisible = false;
            const selectedType = dropdown.property("value");
            drawTreemap(selectedType === "All" ? null : selectedType);
            backButton.style("display", "none");
        });

    // Initial call to draw the treemap with all data
    drawTreemap();

    // Add event listener for window resize
    window.addEventListener('resize', () => {
        const selectedType = dropdown.property("value");
        if (isSubTreemapVisible) {
            drawSubTreemap(currentPrimaryColor, currentData, selectedType === "All" ? null : selectedType);
        } else {
            drawTreemap(selectedType === "All" ? null : selectedType);
        }
    });

    function drawTreemap(filterType = null) {
        const width = window.innerWidth * 0.70;
        const height = window.innerHeight * 0.95;

        // Clear any existing SVG elements
        container.selectAll("svg").remove();

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`);

        // Define the gradient
        const defs = svg.append("defs");
        const clearGradient = defs.append("linearGradient")
            .attr("id", "clear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");
        clearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffffff");
        clearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#6fb0c9"); // Slightly different shade

        // Define the gradient for the shiny effect
        const shinyGradient = defs.append("linearGradient")
            .attr("id", "shiny-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");
        shinyGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "rgba(255, 255, 255, 0.5)")
            .attr("stop-opacity", 0.5);
        shinyGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "rgba(255, 255, 255, 0)")
            .attr("stop-opacity", 0);

        // Filter the data based on the selected gem type
        const filteredTypeData = filterType ? filteredData.filter(d => d.title.toLowerCase().includes(filterType.toLowerCase())) : filteredData;

        const groupedData = d3.rollup(
            filteredTypeData,
            v => ({
                totalCarat: d3.sum(v, d => d.numericCarat),
                count: v.length,
                largestGem: v.reduce((max, gem) => gem.numericCarat > max.numericCarat ? gem : max, v[0]), // Find the largest gem
                data: v // Store the original data points
            }),
            d => d.primaryColor
        );

        // Convert the grouped data into a hierarchical structure
        const root = d3.hierarchy({ children: Array.from(groupedData, ([key, value]) => ({ key, ...value })) })
            .sum(d => d.totalCarat)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(10) // Increase the padding between rectangles
            .round(true);

        treemap(root);

        const node = svg.selectAll("g")
            .data(root.leaves())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        node.append("rect")
            .attr("id", d => d.data.key)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => d.data.key === "clear" ? "url(#clear-gradient)" : (colorMapping[d.data.key] || "#87c9e2")) // Default color if not found in mapping
            .each(function (d) {
                const uniqueColorSubcats = new Set(d.data.data.map(gem => gem.colorSubcat));
                if (uniqueColorSubcats.size > 1) {
                    d3.select(this).on("click", function (event, d) {
                        isSubTreemapVisible = true; // Update the flag
                        currentPrimaryColor = d.data.key; // Store the current primary color
                        currentData = d.data.data; // Store the current data for the sub-treemap
                        svg.selectAll("g").remove();
                        const selectedType = dropdown.property("value");
                        drawSubTreemap(d.data.key, d.data.data, selectedType === "All" ? null : selectedType);
                        backButton.style("display", "block"); // Show the button
                    });
                }
            });

        node.append("text")
            .attr("x", 3)
            .attr("y", function (d) {
                const rectHeight = d.y1 - d.y0;
                const textHeight = this.getBBox().height;
                return Math.min((d.y1 - d.y0) / 2, rectHeight - textHeight - 5); // Ensure text is at least 5 pixels above the bottom
            })
            .attr("dy", ".35em")
            .style("font-size", d => {
                let fontSize = calculateFontSize(d.data.key, d.x1 - d.x0, d.y1 - d.y0);
                return `${Math.min(fontSize, 60)}px`; // Ensure font size does not exceed 40pt
            })
            .style("fill", d => {
                const color = colorMapping[d.data.key] || "#33eedd";
                return isColorDark(color) ? "#ffffff" : "#000000"; // Set text color based on background color
            })
            .text(d => {
                console.log("d.data.key:", d.data.key); // Debugging line
                return d.data.key ? d.data.key.toUpperCase() : "";
            })
            .each(function (d) {
                const text = d3.select(this);
                const rectWidth = (d.x1 - d.x0) * 0.8; // Use 80% of the rectangle's width
                const rectHeight = d.y1 - d.y0;
                let words = text.text().split(/\s+/).reverse();
                let word;
                let line = [];
                let lineNumber = 0;
                const lineHeight = 1.1; // ems
                const y = text.attr("y");
                const dy = parseFloat(text.attr("dy"));
                let tspan = text.text(null).append("tspan").attr("x", 3).attr("y", y).attr("dy", dy + "em");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > rectWidth) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 3).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }

                // Adjust font size if text overflows the rectangle height
                while (text.node().getBBox().height > rectHeight) {
                    let currentFontSize = parseFloat(text.style("font-size"));
                    if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                    text.style("font-size", `${currentFontSize - 1}px`);
                    text.selectAll("tspan").each(function () {
                        d3.select(this).text(function () {
                            return d3.select(this).text();
                        });
                    });
                }

                // Adjust font size if any word is wider than the rectangle width
                text.selectAll("tspan").each(function () {
                    let tspan = d3.select(this);
                    while (tspan.node().getComputedTextLength() > rectWidth) {
                        let currentFontSize = parseFloat(text.style("font-size"));
                        if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                        text.style("font-size", `${currentFontSize - 1}px`);
                        text.selectAll("tspan").each(function () {
                            d3.select(this).text(function () {
                                return d3.select(this).text();
                            });
                        });
                    }
                });

                // Ensure font size does not exceed 40pt
                let finalFontSize = parseFloat(text.style("font-size"));
                if (finalFontSize > 60) {
                    text.style("font-size", "60px");
                }

                // Hide text if font size is below 10pt
                if (finalFontSize < 12) {
                    text.style("visibility", "hidden");
                }
            });

        // Add this function to create a bar chart
        function createBarChart(data, containerId, barColor) {
            const margin = { top: 20, right: 50, bottom: 30, left: 0 };
            const containerWidth = 475; // Fixed width of the container
            const width = containerWidth - margin.left - margin.right;
            const height = 200 - margin.top - margin.bottom;

            // Remove any existing SVG elements
            d3.select(`#${containerId} svg`).remove();

            const svg = d3.select(`#${containerId}`).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleBand()
                .range([0, width])
                .padding(0.3); // Adjust padding to fit bars within the container

            const y = d3.scaleLinear()
                .range([height, 0]);

            x.domain(data.map(d => d.type));
            y.domain([0, d3.max(data, d => d.count)]);

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.type))
                .attr("width", x.bandwidth())
                .attr("y", d => y(d.count))
                .attr("height", d => height - y(d.count))
                .attr("fill", barColor); // Use the passed color


            const xAxis = svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Add labels to the bars
            svg.selectAll(".label")
                .data(data)
                .enter().append("text")
                .attr("class", "label")
                .attr("x", d => x(d.type) + x.bandwidth() / 2)
                .attr("y", d => y(d.count) - 6)
                .attr("text-anchor", "middle")
                .attr("fill", "white") // Set text color to white
                .text(d => d.count);


            // Set x-axis text to white and split into multiple lines
            xAxis.selectAll("text")
                .attr("fill", "white")
                .each(function () {
                    const text = d3.select(this);
                    let words = text.text().split(/\s+/);
                    if (words.length > 2) {
                        words = words.slice(0, 2); // Keep only the first two words
                    }
                    text.text(null);
                    words.forEach((word, i) => {
                        text.append("tspan")
                            .attr("x", 0)
                            .attr("dy", i === 0 ? "4px" : "1.3em") // Adjust the dy value to 3px for the first line
                            .text(word);
                    });
                });

        }

        node.on("mouseover", function (event, d) {
            const originalColor = colorMapping[d.data.key] || "#87c9e2"; // Default color if not found in mapping
            let highlightColor;

            // Check if the primaryColor is "clear" or "black" and set highlightColor to light gray
            if (d.data.key === "clear" || d.data.key === "black") {
                highlightColor = "lightgray";
            } else {
                const colorObj = d3.color(originalColor);
                if (colorObj) {
                    highlightColor = colorObj.brighter(1.5); // Adjust the brightness factor as needed
                } else {
                    highlightColor = "lightgray"; // Fallback color
                }
            }

            const largestGem = d.data.largestGem;
            d3.select("#tree-info").style("border-left-color", originalColor);
            d3.select("#tree-info-content").html(`
                <strong>Number of Gemstones:</strong><br> ${d.data.count}<br><br>
                <strong>Average Weight:</strong><br> ${(d.value / d.data.count).toFixed(2)} ct<br><br>
                <strong style="color: ${highlightColor};">LARGEST GEM IN THE COLLECTION</strong><br>
                <strong>Name/Type:</strong><br> ${largestGem.title}<br><br>
                <strong>Carat:</strong><br>${largestGem.numericCarat} ct<br><br><br>
                <strong style="color: ${highlightColor};">TOP TYPES OF GEMS IN THE COLLECTION</strong><br><br>
            `);
            d3.select("#color-name")
                .text(d.data.key.toUpperCase())
                .style("color", highlightColor);

            // Determine the text color (white or black) based on the rectangle color
            const color = colorMapping[d.data.key];
            const textColor = getTextColorBasedOnBackground(color);
            d3.select(this).select("text").style("stroke", textColor).style("stroke-width", 2);

            // Create bar chart data
            const barChartData = d.data.data.reduce((acc, gem) => {
                let type = gem.title.toLowerCase();

                // Check if the type contains "(var."
                const varMatch = type.match(/\(var\.\s*([^)]+)\)/);
                if (varMatch) {
                    // Extract the word after "(var." and before ")"
                    type = varMatch[1];
                }

                // Capitalize the type
                type = type.toUpperCase();

                if (!acc[type]) {
                    acc[type] = { type, count: 0 };
                }
                acc[type].count += 1;

                return acc;
            }, {});

            const top5Data = Object.values(barChartData)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Determine bar color
            const barColor = (d.data.key === "clear" || d.data.key === "black") ? "lightblue" : originalColor;
            // Create the bar chart with the determined color

            createBarChart(top5Data, "tree-info", barColor);


        })
            .on("mouseout", function () {
                d3.select("#tree-info").style("border-left-color", "#ccc");
                d3.select("#tree-info-content").html("                The Smithsonian boasts one of the largest - and most colorful - gem collections in the world. Here, we explore all of the different shades and hues within the collection. <br><br></br><b>Hover</b> over any color to see the breakdown of the total carats of all of the gems in the " +
                    "Smithsonian's collection, and the types of gems in that color.<br><br>" +
                    "<b>Click</b> on any color to see an additional breakdown of color variations within that specific " +
                    "color.<br><br>" +
                    "<b>Use the dropdown</b> to look specifically at a certain type of gemstone.");
                d3.select("#color-name")
                    .text("")
                    .style("color", ""); // Reset the text color;
                d3.select(this).select("text").style("stroke", "none");

                // Remove the bar chart
                d3.select("#tree-info svg").remove();
            });
        function getTextColorBasedOnBackground(bgColor) {
            // Function to determine if the text color should be white or black based on the background color
            const color = d3.color(bgColor);
            if (!color) {
                return "black"; // Default to black if color parsing fails
            }
            const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
            return brightness > 125 ? "black" : "white";
        }


    }


    // Define the createBarChart function in the global scope
    function createBarChart(data, containerId, barColor) {
        const margin = { top: 20, right: 50, bottom: 30, left: 0 };
        const containerWidth = 475; // Fixed width of the container
        const width = containerWidth - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        // Remove any existing SVG elements
        d3.select(`#${containerId} svg`).remove();

        const svg = d3.select(`#${containerId}`).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.3); // Adjust padding to fit bars within the container

        const y = d3.scaleLinear()
            .range([height, 0]);

        x.domain(data.map(d => d.type));
        y.domain([0, d3.max(data, d => d.count)]);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.type))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.count))
            .attr("height", d => height - y(d.count))
            .attr("fill", barColor); // Use the passed color

        const xAxis = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add labels to the bars
        svg.selectAll(".label")
            .data(data)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d.type) + x.bandwidth() / 2)
            .attr("y", d => y(d.count) - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "white") // Set text color to white
            .text(d => d.count);

        // Set x-axis text to white and split into multiple lines
        xAxis.selectAll("text")
            .attr("fill", "white")
            .each(function () {
                const text = d3.select(this);
                let words = text.text().split(/\s+/);
                if (words.length > 2) {
                    words = words.slice(0, 2); // Keep only the first two words
                }
                text.text(null);
                words.forEach((word, i) => {
                    text.append("tspan")
                        .attr("x", 0)
                        .attr("dy", i === 0 ? "4px" : "1.3em")
                        .text(word);

                });
            });

        // Add hover event to animate bars
        svg.selectAll(".bar")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(7500) // Duration of the animation in milliseconds
                    .attr("y", y(d.count))
                    .attr("height", height - y(d.count));
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200) // Duration of the animation in milliseconds
                    .attr("y", height)
                    .attr("height", 0);
            });
    }

    // Your existing drawSubTreemap function
    function drawSubTreemap(primaryColor, data, filterType = null) {
        const width = window.innerWidth * 0.70;
        const height = window.innerHeight * 0.95;

        // Define specific colors for specific groups
        const colorMapping = {
            "yellow": "#fff700",
            "blue": "#004EE0",
            "green": "#228b22",
            "orange": "#ff7700",
            "purple": "#a200bf",
            "pink": "#fb00d1",
            "red": "#ee0000",
            "black": "#000000",
            "brown": "#874400",
            "white": "#ffffff",
            "gray": "#7e7e7e",
        };

        const colorSubcatMapping = {
            "light": "#ffffff", // light
            "dark": "#000000", // dark
            "light blue": "#BAE8FF", // light blue
            "light yellow": "#FEFF5E", // light yellow
            "light red": "#FF7171", // light red
            "light green": "#98FFA4", // light green
            "light purple": "#D8A9FF", // light purple
            "light pink": "#FFA9F2", // light pink
            "light brown": "#C48322", // light brown
            "light orange": "#FFD18E", // light orange
            "light gray": "#BDBDBD", // light gray
            "medium yellow": "#f1db00",
            "medium blue": "#0064ce",
            "medium green": "#1DB719",
            "medium orange": "#ff7700",
            "medium purple": "#a200bf",
            "medium pink": "#fb00d1",
            "medium red": "#ff0004",
            "medium black": "#000000",
            "medium brown": "#b86100",
            "medium white": "#ffffff",
            "medium gray": "#7e7e7e",
            "dark blue": "#001672",
            "dark green": "#005911",
            "dark red": "#A40000",
            "dark purple": "#7000A4",
            "dark pink": "#A50080",
            "dark brown": "#7A4100",
            "dark orange": "#A45C00",
            "dark gray": "#4C4C4C",
            "dark yellow": "#A4A400",
            "dark brown": "#8C3C00",
            "yellow": "#fff700",
            "blue": "#004EE0",
            "green": "#228b22",
            "orange": "#ff7700",
            "purple": "#a200bf",
            "pink": "#fb00d1",
            "red": "#ee0000",
            "black": "#000000",
            "brown": "#874400",
            "white": "#ffffff",
            "gray": "#7e7e7e",
        };

        // Function to get the color based on primaryColor and colorSubcat
        function getColor(primaryColor, subcat) {
            return colorSubcatMapping[subcat] || colorMapping[primaryColor] || "#000000";
        }

        // Clear any existing SVG elements
        container.selectAll("svg").remove();

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`);

        // Filter the data based on the primaryColor and selected gem type, and exclude null primaryColor
        const filteredData = data.filter(d =>
            d.primaryColor !== null &&
            d.primaryColor !== undefined &&
            d.primaryColor === primaryColor &&
            d.title !== undefined &&
            (!filterType || d.title.toLowerCase().includes(filterType.toLowerCase()))
        );

        const groupedData = d3.rollup(
            filteredData,
            v => ({
                totalCarat: d3.sum(v, d => d.numericCarat),
                count: v.length,
                largestGem: v.reduce((max, gem) => gem.numericCarat > max.numericCarat ? gem : max, v[0]), // Find the largest gem
                data: v // Store the original data points
            }),
            d => d.colorSubcat
        );

        // Convert the grouped data into an array and sort by totalCarat
        const sortedGroups = Array.from(groupedData, ([key, value]) => ({ key, ...value }))
            .sort((a, b) => b.totalCarat - a.totalCarat)
            .slice(0, 12); // Take the top 12 groups

        // Convert the sorted groups into a hierarchical structure
        const root = d3.hierarchy({ children: sortedGroups })
            .sum(d => d.totalCarat)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(10) // Increase the padding between rectangles
            .round(true);

        treemap(root);

        const node = svg.selectAll("g")
            .data(root.leaves())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        node.append("rect")
            .attr("id", d => d.data.key)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => colorMapping[primaryColor]); // Set the fill color to primaryColor

        // Adjust the color based on the subcategory
        node.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => {
                if (colorSubcatMapping[d.data.key] === "medium") {
                    return colorMapping[primaryColor];
                }
                return colorSubcatMapping[d.data.key] || "#000000"; // Use colorSubcat or default to black
            })
            .attr("opacity", d => colorSubcatMapping[d.data.key] ? 0.45 : 0.0);

        node.append("text")
            .attr("x", 3)
            .attr("y", function (d) {
                const rectHeight = d.y1 - d.y0;
                const textHeight = this.getBBox().height;
                return Math.min((d.y1 - d.y0) / 2, rectHeight - textHeight - 5); // Ensure text is at least 5 pixels above the bottom
            })
            .attr("dy", ".35em")
            .style("font-size", d => {
                let fontSize = calculateFontSize(d.data.key, d.x1 - d.x0, d.y1 - d.y0);
                return `${Math.min(fontSize, 60)}px`; // Ensure font size does not exceed 40pt
            })
            .style("fill", d => {
                const color = colorSubcatMapping[d.data.key] || "#33eedd";
                return isColorDark(color) ? "#ffffff" : "#000000"; // Set text color based on background color
            })
            .text(d => {
                console.log("d.data.key:", d.data.key); // Debugging line
                return d.data.key ? d.data.key.toUpperCase() : "";
            })
            .each(function (d) {
                const text = d3.select(this);
                const rectWidth = (d.x1 - d.x0) * 0.8; // Use 80% of the rectangle's width
                const rectHeight = d.y1 - d.y0;

                // Append subTreecat text
                text.append("tspan")
                    .attr("x", 3)
                    .attr("y", text.attr("y"))
                    .attr("dy", text.attr("dy"))
                    .text(d.data.key && d.data.key.split(" ").length > 1 ? d.data.key.toUpperCase() + "-" : ""); // Ensure d.data.key is not null or undefined and has more than one word


                // Append primaryColor text on the next line
                text.append("tspan")
                    .attr("x", 3)
                    .attr("y", text.attr("y"))
                    .attr("dy", "1.2em") // Adjust dy to move to the next line
                    .text(primaryColor ? primaryColor.toUpperCase() : ""); // Ensure primaryColor is not null or undefined

                // Adjust font size if text overflows the rectangle height
                while (text.node().getBBox().height > rectHeight) {
                    let currentFontSize = parseFloat(text.style("font-size"));
                    if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                    text.style("font-size", `${currentFontSize - 1}px`);
                    text.selectAll("tspan").each(function () {
                        d3.select(this).text(function () {
                            return d3.select(this).text();
                        });
                    });
                }

                // Adjust font size if any word is wider than the rectangle width
                text.selectAll("tspan").each(function () {
                    let tspan = d3.select(this);
                    while (tspan.node().getComputedTextLength() > rectWidth) {
                        let currentFontSize = parseFloat(text.style("font-size"));
                        if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                        text.style("font-size", `${currentFontSize - 1}px`);
                        text.selectAll("tspan").each(function () {
                            d3.select(this).text(function () {
                                return d3.select(this).text();
                            });
                        });
                    }
                });

                // Ensure font size does not exceed 40pt
                let finalFontSize = parseFloat(text.style("font-size"));
                if (finalFontSize > 60) {
                    text.style("font-size", "60px");
                }

                // Hide text if font size is below 10pt
                if (finalFontSize < 10) {
                    text.style("visibility", "hidden");
                }
            });

        node.on("mouseover", function (event, d) {
            const originalColor = colorMapping[primaryColor] || "#87c9e2"; // Default color if not found in mapping
            let highlightColor;

            // Check if the primaryColor is "clear" or "black" and set highlightColor to light gray
            if (d.data.key === "clear" || d.data.key === "black") {
                highlightColor = "lightgray";
            } else {
                const colorObj = d3.color(originalColor);
                if (colorObj) {
                    highlightColor = colorObj.brighter(1.5); // Adjust the brightness factor as needed
                } else {
                    highlightColor = "lightgray"; // Fallback color
                }
            }
            const color = getColor(primaryColor, d.data.key);
            const largestGem = d.data.largestGem;
            d3.select("#tree-info").style("border-left-color", colorMapping[primaryColor]);
            d3.select("#tree-info-content").html(`
                    <strong>Number of Gemstones:</strong><br> ${d.data.count}<br><br>
                    <strong>Average Weight:</strong><br> ${(d.value / d.data.count).toFixed(2)} ct<br><br>
                    <strong style="color: ${highlightColor};">LARGEST GEM IN THE COLLECTION</strong><br>
                    <strong>Name:</strong><br> ${largestGem.title}<br><br>
                    <strong>Carat:</strong><br> ${largestGem.numericCarat} ct<br><br><br>
                     <strong style="color: ${highlightColor};">TOP TYPES OF GEMS IN THE COLLECTION</strong><br><br>
                `);
            d3.select("#color-name").text((d.data.key && d.data.key.split(" ").length > 1 ? d.data.key.toUpperCase() + "-" : "") + " " + primaryColor.toUpperCase()); // Ensure d.data.key is not null or undefined and has more than one word

            // .text(d.data.key.toUpperCase() + " " + primaryColor.toUpperCase());

            // Determine the text color (white or black) based on the rectangle color
            const textColor = getTextColorBasedOnBackground(color);
            d3.select(this).select("text").style("stroke", textColor).style("stroke-width", 2);

            // Create bar chart data
            const barChartData = d.data.data.reduce((acc, gem) => {
                let type = gem.title.toLowerCase();

                // Check if the type contains "(var."
                const varMatch = type.match(/\(var\.\s*([^)]+)\)/);
                if (varMatch) {
                    // Extract the word after "(var." and before ")"
                    type = varMatch[1];
                }

                // Capitalize the type
                type = type.toUpperCase();

                if (!acc[type]) {
                    acc[type] = { type, count: 0 };
                }
                acc[type].count += 1;

                return acc;
            }, {});

            const top5Data = Object.values(barChartData)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Determine bar color
            const baseColor = colorMapping[primaryColor];
            const overlayColor = colorSubcatMapping[d.data.key] || "#000000";

            // Create the bar chart with the determined color
            createBarChart(top5Data, "tree-info", baseColor, overlayColor);
        })
            .on("mouseout", function () {
                d3.select("#tree-info").style("border-left-color", "#ccc");
                d3.select("#tree-info-content").html("The Smithsonian boasts one of the largest - and most colorful - gem collections in the world. Here, we explore all of the different shades and hues within the collection. <br></br><b>Hover</b> over any color to see the breakdown of the total carats of all of the gems in the " +
                    "Smithsonian's collection, and the types of gems in that color.<br><br>" +
                    "<b>Click</b> on any color to see an additional breakdown of color variations within that specific " +
                    "color.<br><br>" +
                    "<b>Use the dropdown</b> to look specifically at a certain type of gemstone.");
                d3.select("#color-name").text("");
                d3.select(this).select("text").style("stroke", "none");

                // Remove the bar chart
                d3.select("#tree-info svg").remove();
            });

        function getTextColorBasedOnBackground(bgColor) {
            // Function to determine if the text color should be white or black based on the background color
            const color = d3.color(bgColor);
            const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
            return brightness > 125 ? "black" : "white";
        }
    }

});

//NOTABLE GEMS
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Scrollama
    const scroller = scrollama();

    // Fetch the JSON data
    fetch('Data/notableGemsContent.json')
        .then(response => response.json())
        .then(dataContent => {
            // Store the data in a variable
            const contents = dataContent;

            // Setup the scroller
            scroller
                .setup({
                    step: '#notable-gems .step', // The elements to watch
                    offset: 0.5, // The offset from the top of the viewport
                    debug: true // Enable debugging
                })
                .onStepEnter(response => {
                    // Handle step enter
                    const { element, index, direction } = response;
                    console.log('Step enter:', index, direction);
                    element.classList.add('is-active');

                    // Update the content in the #notable-info-content and #notable-name containers
                    const { name,
                        'content-1': content1,
                        'subhead-1': subhead1,
                        'content-2': content2,
                        'subhead-2': subhead2,
                        'content-3': content3 } = contents[index] ||
                        {
                            name: 'Default Name',
                            'content-1': 'Default content',
                            'subhead-1': 'Default subhead',
                            'content-2': 'Default content'
                        };
                    document.getElementById('notable-name').innerHTML = name;
                    document.getElementById('notable-info-content').innerHTML =
                        `<h3>${content1}</h3>
                        <br><h2>${subhead1}</h2>
                        <br><h3>${content2}</h3>
                        <br><h2>${subhead2}</h2>
                        <br><h3>${content3}</h3>`;


                })
                .onStepExit(response => {
                    // Handle step exit
                    const { element, index, direction } = response;
                    console.log('Step exit:', index, direction);
                    element.classList.remove('is-active');
                });

        })
    // Function to get content for each step
    function getContentForStep(index) {
        const contents = [
            { name: 'Hope Diamond', content: 'Content for DeYoung Pink Diamond: Detailed description of DeYoung Pink Diamond.' },
            { name: 'Hope Diamond', content: 'Content for Hope Diamond: Detailed description of Hope Diamond.' },
            { name: 'Kimberly Diamond', content: 'Content for Kimberly Diamond: Detailed description of Kimberly Diamond.' },
            { name: 'American Golden', content: 'Content for American Golden: Detailed description of American Golden.' },
            // Add more content as needed
        ];
        return contents[index] || { name: 'Default Name', content: 'Default content' };
    }

});


// LEARN ABOUT GEMS
d3.json('locationdata.json').then(data => {
    // Function to capitalize the first letter of each word
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    // Process the data to count the total number of each type of gem, ignoring text in parentheses
    const gemCounts = Array.from(d3.group(data, d => {
        let type = d.type;
        const varMatch = type.match(/\(var\.\s*([^)]+)\)/);
        if (varMatch) {
            // Extract the word after "(var." and before ")"
            type = varMatch[1];
        }
        // Normalize any type containing "agate" to "Agate"
        if (type.toLowerCase().includes("agate")) {
            type = "Agate";
        }
        // Capitalize the type
        type = capitalizeWords(type);
        return type;
    }), ([key, value]) => ({ key, value: value.length }));

    // Sort the data from highest to lowest
    gemCounts.sort((a, b) => b.value - a.value);

    // Keep only the top 20 gems
    const topGemCounts = gemCounts.slice(0, 20);

    // Log the processed data to check for issues
    console.log(topGemCounts);

    // Set up the SVG container
    const margin = { top: 20, right: 30, bottom: 300, left: 100 }; // Increased left margin
    const width = 600 - margin.left - margin.right;
    const height = Math.ceil(topGemCounts.length * 20); // Adjust height based on the number of gem types

    const svg = d3.select('#gem-chart-1')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(topGemCounts, d => d.value)])
        .nice()
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(topGemCounts.map(d => d.key))
        .range([0, height])
        .padding(0.1);

    // Create axes
    svg.append('g')
        .attr('class', 'y-axis')
        .attr('id', 'y-axis-type')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('font-size', '12px') // Adjust font size for clarity
        .style('text-anchor', 'end') // Align text to the end
        .attr('dx', '-0.5em') // Adjust horizontal position
        .attr('dy', '0.25em'); // Adjust vertical position

    // Create bars
    const bars = svg.selectAll('.bar')
        .data(topGemCounts)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.key))
        .attr('width', 0) // Start with width 0 for animation
        .attr('height', y.bandwidth())
        .attr('fill', '#90ee90'); // Set the fill color to light green

    // Add data labels
    const labels = svg.selectAll('.label')
        .data(topGemCounts)
        .enter().append('text')
        .attr('class', 'label')
        .attr('id', "type-chart-label")
        .attr('x', d => x(d.value) + 5) // Position the label to the right of the bar
        .attr('y', d => y(d.key) + y.bandwidth() / 2)
        .attr('dy', '0.35em') // Adjust vertical alignment
        .attr('opacity', 0) // Start with opacity 0
        .text(d => d.value);

    // Intersection Observer to animate bars when they come into view
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = d3.select(entry.target);
                bar.transition()
                    .duration(1000)
                    .attr('width', d => x(d.value)) // Animate width from 0 to the correct value
                    .on('end', function (d) {
                        d3.select(this.parentNode).selectAll('.label')
                            .filter(labelData => labelData.key === d.key)
                            .transition()
                            .duration(500)
                            .attr('opacity', 1); // Animate opacity from 0 to 1
                    });
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, { threshold: 0.1 });

    // Observe each bar
    bars.each(function () {
        observer.observe(this);
    });

    // Add the image to the right of the bar chart
    const imgWidth = 600;
    const imgHeight = 600;
    const svgWidth = width + margin.left + margin.right + imgWidth + 500;
    const captionText1 = "An Agate sample from the collection"; // Adjust SVG width to accommodate the image

    // Update the SVG container width
    d3.select('#gem-chart-1 svg')
        .attr('width', svgWidth);

    svg.append('image')
        .attr('xlink:href', 'GemImages/agate1.jpg')
        .attr('x', width + margin.right + 250) // Position to the right of the chart
        .attr('y', -100)
        .attr('width', imgWidth)
        .attr('height', imgHeight)
        .attr('opacity', 0) // Start with opacity 0 for fade-in effect
        .transition()
        .delay(2500) // Delay to ensure bars are rendered
        .duration(1500)
        .attr('opacity', 1); // Fade-in effect

    // Add the caption text
    svg.append('text')
        .attr('x', width + margin.right + 250 + imgWidth / 2) // Center the text under the image
        .attr('y', imgHeight - 175) // Position below the image
        .attr('text-anchor', 'middle') // Center align the text
        .attr('opacity', 0) // Start with opacity 0 for fade-in effect
        .text(captionText1)
        .attr('fill', 'white') // Set text color to white
        .transition()
        .delay(3000) // Delay to ensure the image has finished appearing
        .duration(1500)
        .attr('opacity', 1); // Fade-in effect

    // New chart for jewelry types
    const jewelryCounts = Array.from(d3.group(data.filter(d => d.jewelryType !== "Unknown"), d => d.jewelryType), ([key, value]) => ({ key, value: value.length }));

    // Sort the data from highest to lowest
    jewelryCounts.sort((a, b) => b.value - a.value);

    // Keep only the top 10 jewelry types
    const topJewelryCounts = jewelryCounts.slice(0, 10);

    // Set up the SVG container for the new chart
    const margin2 = { top: 100, right: 30, bottom: 250, left: 100 };
    const width2 = 800 - margin2.left - margin2.right;
    const height2 = Math.ceil(topJewelryCounts.length * 45);

    const svg2 = d3.select('#gem-chart-2')
        .append('svg')
        .attr('width', width2 + margin2.left + margin2.right)
        .attr('height', height2 + margin2.top + margin2.bottom)
        .append('g')
        .attr('transform', `translate(${margin2.left},${margin2.top})`);

    // Create scales for the new chart
    const x2 = d3.scaleBand()
        .domain(topJewelryCounts.map(d => d.key))
        .range([0, width2])
        .padding(0.1);

    const y2 = d3.scaleLinear()
        .domain([0, d3.max(topJewelryCounts, d => d.value)])
        .nice()
        .range([height2, 0]);

    // Create axes for the new chart
    svg2.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height2})`)
        .call(d3.axisBottom(x2))
        .selectAll('text')
        .style('color', 'white')
        .style('font-family', 'Jura')
        .style('font-size', '14px')
        .style('text-anchor', 'right')
        .attr('dx', '-0.5em')
        .attr('dy', '0.25em');

    // Create bars for the new chart
    const bars2 = svg2.selectAll('.bar')
        .data(topJewelryCounts)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x2(d.key))
        .attr('y', height2) // Start at the bottom
        .attr('width', x2.bandwidth())
        .attr('height', 0) // Start with height 0 for animation
        .attr('fill', '#e7ec93');

    // Add data labels to the new chart
    const labels2 = svg2.selectAll('.label')
        .data(topJewelryCounts)
        .enter().append('text')
        .attr('id', "type-chart-label")
        .attr('class', 'label')
        .attr('x', d => x2(d.key) + x2.bandwidth() / 2)
        .attr('y', d => y2(d.value) - 5) // Position above the bar
        .attr('text-anchor', 'middle')
        .attr('opacity', 0) // Start with opacity 0
        .text(d => d.value);

    // Intersection Observer to animate bars when they come into view
    const observer2 = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = d3.select(entry.target);
                bar.transition()
                    .duration(1000)
                    .attr('height', d => height2 - y2(d.value))
                    .attr('y', d => y2(d.value)) // Animate height from 0 to the correct value
                    .on('end', function (d) {
                        d3.select(this.parentNode).selectAll('.label')
                            .filter(labelData => labelData.key === d.key)
                            .transition()
                            .duration(500)
                            .attr('opacity', 1); // Animate opacity from 0 to 1
                    });
                observer2.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, { threshold: 0.1 });

    // Observe each bar in the second chart
    bars2.each(function () {
        observer2.observe(this);
    });

    // Add the image to the right of the second bar chart
    const imgWidth2 = 600;
    const imgHeight2 = 600;
    const svgWidth2 = width2 + margin2.left + margin2.right + imgWidth2 + 20;
    const captionText2 = "The Kimberley Diamond, set in a necklace"; // Adjust SVG width to accommodate the image

    // Update the SVG container width
    d3.select('#gem-chart-2 svg')
        .attr('width', svgWidth2);

    svg2.append('image')
        .attr('xlink:href', 'GemImages/kimberlydiamond.jpg')
        .attr('x', width2 + margin2.right + 20) // Position to the right of the chart
        .attr('y', -120)
        .attr('width', imgWidth2)
        .attr('height', imgHeight2)
        .attr('opacity', 0) // Start with opacity 0 for fade-in effect
        .transition()
        .delay(6000) // Delay to ensure bars are rendered
        .duration(3000)
        .attr('opacity', 1); // Fade-in effect

    // Add the caption text
    svg2.append('text')
        .attr('x', width2 + margin2.right + 20 + imgWidth2 / 2) // Center the text under the image
        .attr('y', imgHeight2 - 100) // Position below the image
        .attr('text-anchor', 'middle') // Center align the text
        .attr('opacity', 0) // Start with opacity 0 for fade-in effect
        .text(captionText2)
        .attr('fill', 'white') // Set text color to white
        .transition()
        .delay(5000) // Delay to ensure the image has finished appearing
        .duration(1500)
        .attr('opacity', 1); // Fade-in effect
});