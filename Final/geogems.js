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

const svg = d3.select('#main-container').append('svg')
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
            d3.select('#info-content').html(`
                <g><h3>GEM:</h3>${d.type}<br><br>
                <h3>LOCATION:</h3> ${d.place}<br><br>
                <h3>WEIGHT:</h3> ${d.carat || 'N/A'}<br><br>
                <h3>COLOR:</h3> ${d.color || 'N/A'}<br><br>
            `);
        })
        .on('mouseout', () => {
            d3.select('#info-content').text('Hover over a circle to see details.');
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


