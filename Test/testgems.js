// fade-in effect and smooth scrolling
/*document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.intro-link');
    const sections = document.querySelectorAll('.page-section');
    const backToTopButton = document.getElementById('back-to-top'); // Define the backToTopButton variable

    links.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            sections.forEach(section => {
                section.classList.remove('visible');
            });

            targetSection.classList.add('visible');
            targetSection.scrollIntoView({ behavior: 'auto' });
            // Show the back-to-top button
            backToTopButton.style.display = 'block';
        });
    });
    // Add click event to the back-to-top button
    backToTopButton.addEventListener('click', function () {
        // Scroll to the top
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('visible');
        });

        // Show the initial page section
        document.getElementById('IntroPage').classList.add('visible');

        // Hide the button after scrolling to the top
        this.style.display = 'none';
    });
});*/

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
const initialWidth = window.innerWidth * 0.7;
const initialHeight = window.innerHeight * 0.75;
const verticalOffset = 20; // Adjust this value to make room for the heading
const bottomMargin = 10; // Margin at the bottom of the map
const width = window.innerWidth * 0.75;
const height = window.innerHeight - bottomMargin;

const projection = d3.geoMercator()
    .center([0, 0])
    .scale(initialWidth / 6)
    .translate([initialWidth / 2, initialHeight / 2 + verticalOffset]); // Center the map

const path = d3.geoPath().projection(projection);

const svg = d3.select('#main-map').append('svg')
    .attr('width', '75%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${initialWidth} ${initialHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

// Create groups for map and circles
const mapGroup = svg.append('g').attr('class', 'map');
const circlesGroup = svg.append('g').attr('class', 'circles');


// Zoom handler
const zoom = d3.zoom()
    .scaleExtent([1, 8]) // Set the zoom scale extent
    .on('zoom', (event) => {
        mapGroup.attr('transform', event.transform);
        circlesGroup.attr('transform', event.transform);
    });

svg.call(zoom);



// Function to populate the dropdown with unique colors
function populateDropdown(data) {
    const colorDropdown = document.getElementById('color-dropdown');
    const uniqueColors = [...new Set(data.map(d => d.primaryColor).filter(color => color))];
    uniqueColors.forEach(color => {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = color;
        colorDropdown.appendChild(option);
    });
}

// Function to populate the country dropdown with unique countries
function populateCountryDropdown(data) {
    const countryDropdown = document.getElementById('country-dropdown');
    const uniqueCountries = [...new Set(data
        .filter(d => d.lat !== "Unknown" && d.long !== "Unknown") // Filter data points with lat and long not "Unknown"
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
    const filteredData = data.filter(d => d.long !== "Unknown" && d.lat !== "Unknown" && d.place !== "Unknown");


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
                'blue': '#3b4eff',
                'green': '#17b035',
                'yellow': '#fae52a',
                'purple': '#c478ff',
                'orange': '#f58822',
                'pink': '#de4ba8',
                'black': '#000000',
                'white': '#ffffff',
                'brown': '#8b4513',
            };
            return colorMapping[d.primaryColor] || '#abc1c4';
        })
        .attr('stroke', '#393939') // Add dark stroke
        .attr('stroke-width', 0.1) // Set stroke width
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

    // Update the viewbox based on the data points
    updateViewBox(filteredData);
}

// Define the updateViewBox function
function updateViewBox(data) {
    const minViewBoxWidth = 100; // Minimum width for the viewBox
    const minViewBoxHeight = 100; // Minimum height for the viewBox

    if (data.length === 1 || data.every(d => d.lat === data[0].lat && d.long === data[0].long)) {
        // If there is only one data point or all data points have the same lat and long
        const singlePoint = data[0];
        const center = projection([parseFloat(singlePoint.long), parseFloat(singlePoint.lat)]);
        const viewBoxWidth = Math.max(minViewBoxWidth, 100); // Ensure minimum width
        const viewBoxHeight = Math.max(minViewBoxHeight, 100); // Ensure minimum height
        const centerX = center[0] - viewBoxWidth / 2;
        const centerY = center[1] - viewBoxHeight / 2;

        svg.attr('viewBox', `${centerX} ${centerY} ${viewBoxWidth} ${viewBoxHeight}`);
    } else {
        // Existing logic for multiple data points with different lat and long values
        const minLat = d3.min(data, d => parseFloat(d.lat));
        const maxLat = d3.max(data, d => parseFloat(d.lat));
        const minLong = d3.min(data, d => parseFloat(d.long));
        const maxLong = d3.max(data, d => parseFloat(d.long));

        const latDiff = maxLat - minLat;
        const longDiff = maxLong - minLong;

        const centerLat = (minLat + maxLat) / 2;
        const centerLong = (minLong + maxLong) / 2;

        let viewBoxWidth, viewBoxHeight;
        let topLeft, bottomRight;

        if (latDiff > longDiff) {
            // Determine view based on height
            topLeft = projection([minLong, maxLat]);
            bottomRight = projection([maxLong, minLat]);
            viewBoxWidth = bottomRight[0] - topLeft[0];
            viewBoxHeight = bottomRight[1] - topLeft[1];

            // Adjust for 10px margin on left and right
            const leftMargin = 10;
            const rightMargin = 10;
            viewBoxWidth += leftMargin + rightMargin;
            topLeft[0] -= leftMargin;
        } else {
            // Determine view based on width
            topLeft = projection([minLong, maxLat]);
            bottomRight = projection([maxLong, minLat]);
            viewBoxWidth = bottomRight[0] - topLeft[0];
            viewBoxHeight = bottomRight[1] - topLeft[1];

            // Adjust for 10px margin on top and bottom
            const topMargin = 10;
            const bottomMargin = 10;
            viewBoxHeight += topMargin + bottomMargin;
            topLeft[1] -= topMargin;
        }

        // Ensure minimum viewBox dimensions
        viewBoxWidth = Math.max(viewBoxWidth, minViewBoxWidth);
        viewBoxHeight = Math.max(viewBoxHeight, minViewBoxHeight);

        const center = projection([centerLong, centerLat]);
        const centerX = center[0] - viewBoxWidth / 2;
        const centerY = center[1] - viewBoxHeight / 2;

        svg.attr('viewBox', `${centerX} ${centerY} ${viewBoxWidth} ${viewBoxHeight}`);
    }
}

// Define the renderMap function
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
            .attr('stroke', '#333')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('stroke', 'blue');
            })
            .on('mouseout', function (event, d) {
                d3.select(this).attr('stroke', '#333');
            });

        // Load the JSON data using fetch
        fetch('locationdata.json')
            .then(response => response.json())
            .then(loadedData => {
                data = loadedData; // Assign the loaded data to the global data variable
                console.log(data); // Log the data to inspect its format

                // Populate the dropdowns with unique colors and countries
                populateDropdown(data);
                populateCountryDropdown(data);

                // Initial rendering of circles
                updateCircles(data);

                // Add event listener to the color dropdown
                const colorDropdown = document.getElementById('color-dropdown');
                colorDropdown.addEventListener('change', () => {
                    const selectedColor = colorDropdown.value;
                    const filteredData = filterData(data, selectedColor);
                    updateCircles(filteredData);

                    // Count the number of gems with the selected color
                    const gemCount = filteredData.length;
                    const gemCountText = selectedColor === 'all' ? '' : `<h3>Number of ${selectedColor} gems:</h3> ${gemCount}`;

                    // Update the info content with the gem count
                    d3.select('#info-content').html(`Hover over a circle to see details.<br>${gemCountText}`);
                });

                // Add event listener to the country dropdown
                const countryDropdown = document.getElementById('country-dropdown');
                countryDropdown.addEventListener('change', () => {
                    const selectedCountry = countryDropdown.value;
                    const filteredData = filterDataByCountry(data, selectedCountry);
                    updateCircles(filteredData);

                    // Count the number of gems with the selected country
                    const gemCount = filteredData.length;
                    const gemCountText = selectedCountry === 'all' ? '' : `<h3>Number of gems in ${selectedCountry}:</h3> ${gemCount}`;

                    // Update the info content with the gem count
                    d3.select('#info-content').html(`Hover over a circle to see details.<br>${gemCountText}`);

                    // Zoom in on the selected country
                    if (selectedCountry !== 'all') {
                        const minLat = d3.min(filteredData, d => parseFloat(d.lat)) - 5;
                        const maxLat = d3.max(filteredData, d => parseFloat(d.lat)) + 5;
                        const minLong = d3.min(filteredData, d => parseFloat(d.long));
                        const maxLong = d3.max(filteredData, d => parseFloat(d.long));

                        const topLeft = projection([minLong, maxLat]);
                        const bottomRight = projection([maxLong, minLat]);

                        const dx = bottomRight[0] - topLeft[0];
                        const dy = bottomRight[1] - topLeft[1];
                        const x = (topLeft[0] + bottomRight[0]) / 2;
                        const y = (topLeft[1] + bottomRight[1]) / 2;
                        const maxScale = 3; // Define the maximum scale value
                        let scale = Math.max(1, Math.min(maxScale, 0.5 / Math.max(dx / width, dy / height)));
                        const translate = [width / 2 - scale * x, height / 2 - scale * y];

                        svg.transition()
                            .duration(750)
                            .call(
                                zoom.transform,
                                //d3.zoomIdentity.translate(translate[0], translate[0]).scale(scale)
                            );
                    } else {
                        svg.transition()
                            .duration(750)
                            .call(
                                zoom.transform,
                                d3.zoomIdentity.translate(0, 0).scale(1)
                            );
                    }
                });

                // Add event listeners to the buttons
                const exploreByColorButton = document.getElementById('explore-by-color');
                const exploreByCountryButton = document.getElementById('explore-by-country');

                exploreByColorButton.addEventListener('click', () => {
                    document.getElementById('color-dropdown').style.display = 'block';
                    document.getElementById('country-dropdown').style.display = 'none';
                    exploreByColorButton.classList.add('active');
                    exploreByCountryButton.classList.remove('active');
                });

                exploreByCountryButton.addEventListener('click', () => {
                    document.getElementById('color-dropdown').style.display = 'none';
                    document.getElementById('country-dropdown').style.display = 'block';
                    exploreByCountryButton.classList.add('active');
                    exploreByColorButton.classList.remove('active');
                });

                // Add zoom in and zoom out functionality
                const zoomInButton = document.getElementById('zoom-in');
                const zoomOutButton = document.getElementById('zoom-out');
                const zoomFactor = 1.25;

                zoomInButton.addEventListener('click', () => {
                    const currentScale = projection.scale();
                    projection.scale(currentScale * zoomFactor);
                    mapGroup.selectAll('path').attr('d', path);
                    updateCircles(data); // Re-render circles with the new projection
                });

                zoomOutButton.addEventListener('click', () => {
                    const currentScale = projection.scale();
                    projection.scale(currentScale / zoomFactor);
                    mapGroup.selectAll('path').attr('d', path);
                    updateCircles(data); // Re-render circles with the new projection
                });

                // Add window resize event listener
                window.addEventListener('resize', () => {
                    const newWidth = window.innerWidth * 0.75;
                    const newHeight = window.innerHeight - bottomMargin;

                    // Calculate the new scale and translation to fit the map within the window
                    const aspectRatio = initialWidth / initialHeight;
                    const newAspectRatio = newWidth / newHeight;
                    const newScale = (newAspectRatio > aspectRatio) ? newHeight / initialHeight * (initialWidth / 6) : newWidth / initialWidth * (initialWidth / 6);
                    const newTranslate = [newWidth / 2, newHeight / 2 + verticalOffset]; // Center the map

                    projection
                        .translate(newTranslate)
                        .scale(newScale);

                    // Update the map and circles with the new projection
                    svg.attr('width', newWidth).attr('height', newHeight);
                    mapGroup.selectAll('path').attr('d', path);
                    updateCircles(data); // Re-render circles with the new projection
                });
            })
            .catch(error => console.error('Error loading the data:', error));
    }).catch(error => console.error('Error loading the world map:', error));
}

// Function to filter data based on selected color
function filterData(data, selectedColor) {
    if (selectedColor === 'all') {
        return data;
    }
    return data.filter(d => d.primaryColor === selectedColor);
}

// Function to filter data based on selected country
function filterDataByCountry(data, selectedCountry) {
    if (selectedCountry === 'all') {
        return data;
    }
    return data.filter(d => d.country === selectedCountry);
}

renderMap();



// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth * 0.75;
    const newHeight = window.innerHeight - bottomMargin;

    // Calculate the new scale and translation to fit the map within the window
    const aspectRatio = initialWidth / initialHeight;
    const newAspectRatio = newWidth / newHeight;
    const newScale = (newAspectRatio > aspectRatio) ? newHeight / initialHeight * (initialWidth / 6) : newWidth / initialWidth * (initialWidth / 6);
    const newTranslate = [newWidth / 2, newHeight / 2 + verticalOffset]; // Center the map

    projection
        .translate(newTranslate)
        .scale(newScale);

    // Update the map and circles with the new projection
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
                .style("border", "2px solid #303030");
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
            const containerWidth = 410; // Fixed width of the container
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
                            .attr("dy", i === 0 ? 0 : "1.2em")
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

            // Update bar colors on hover
            d3.selectAll(".bar")
                .attr("fill", function (d) {
                    if (d.data.key === "clear") {
                        return "lightblue"; // Set color to light blue for "clear" group
                    } else {
                        return baseColor; // Use the base color for other groups
                    }
                });

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
        const containerWidth = 410; // Fixed width of the container
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
                        .attr("dy", i === 0 ? 0 : "1.2em")
                        .text(word);
                });
            });

        // Add hover event to animate bars
        svg.selectAll(".bar")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(500) // Duration of the animation in milliseconds
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
                    const { name, 'content-1': content1, 'subhead-1': subhead1, 'content-2': content2, 'subhead-2': subhead2, 'content-3': content3 } = contents[index] || { name: 'Default Name', 'content-1': 'Default content', 'subhead-1': 'Default subhead', 'content-2': 'Default content' };
                    document.getElementById('notable-name').innerHTML = name;
                    document.getElementById('notable-info-content').innerHTML =
                        `<p>${content1}</p>
                        <br><h3>${subhead1}</h3>
                        <br><p>${content2}</p>
                        <br><h3>${subhead2}</h3>
                        <br><p>${content3}</p>`;


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
            { name: 'DeYoung Pink Diamond', content: 'Content for DeYoung Pink Diamond: Detailed description of DeYoung Pink Diamond.' },
            { name: 'Hope Diamond', content: 'Content for Hope Diamond: Detailed description of Hope Diamond.' },
            { name: 'Kimberly Diamond', content: 'Content for Kimberly Diamond: Detailed description of Kimberly Diamond.' },
            // Add more content as needed
        ];
        return contents[index] || { name: 'Default Name', content: 'Default content' };
    }


});


