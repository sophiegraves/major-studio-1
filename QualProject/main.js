let gems;
let allGems = [];

// Load the data
d3.json('Data/gemdata.json').then(data => {
    gems = data;
    const Columns = Object.keys(data[0]);
    analyzeData();
    sortAndGroupGems(); // Perform sorting and grouping after data is analyzed
    //displayData();
});

// Analyze the data
function analyzeData() {
    // Go through the list of gems
    gems.forEach(n => {
        const title = n.title;
        const mineraltype = n.type;
        const caratInt = n.numericCarat;
        const fullColor = n.color;
        const link = n.link;
        const id = n.id;
        const firstColor = n.hues[0];
        const secondColor = n.hues[1];
        let match = false;

        // See if their location already exists in the array
        allGems.forEach(p => {
            if (p.title == id) {
                p.count++;
                match = true;
            }
        });

        // If not, create a new entry for that place name
        if (!match) {
            allGems.push({
                title: title,
                mineraltype: mineraltype,
                caratInt: caratInt,
                fullColor: fullColor,
                firstColor: firstColor,
                secondColor: secondColor,
                id: id,
                link: link,
                //imgLink: imgLink,
            });
        }
    });
}

// Sort and group gems by firstColor
function sortAndGroupGems() {
    // Sort allGems by firstColor
    // Assuming allGems is an array of objects with a firstColor and caratInt property
    allGems.sort((a, b) => {
        const colorA = a.firstColor ? a.firstColor.toLowerCase().trim() : "";
        const colorB = b.firstColor ? b.firstColor.toLowerCase().trim() : "";
        if (colorA < colorB) return -1;
        if (colorA > colorB) return 1;
        return 0;
    });

    // Group gems by firstColor and calculate total caratInt for each color
    const groupedByColor = allGems.reduce((acc, gem) => {
        const color = gem.firstColor ? gem.firstColor.toLowerCase().trim() : "";
        if (!acc[color]) {
            acc[color] = { color: color, totalCarat: 0, gems: [] };
        }
        acc[color].totalCarat += gem.caratInt;
        acc[color].gems.push(gem);
        return acc;
    }, {});

    console.log(groupedByColor);

    // Prepare data for D3.js
    const data = Object.values(groupedByColor);

    // Set up the SVG canvas dimensions
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Create the SVG canvas
    const svg = d3.select("#visual-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a treemap layout
    const treemap = d3.treemap()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
        .padding(1);

    // Create a hierarchy from the data
    const root = d3.hierarchy({ values: data }, d => d.values)
        .sum(d => d.totalCarat)
        .sort((a, b) => b.value - a.value);

    // Apply the treemap layout to the hierarchy
    treemap(root);

    // Create the rectangles for the treemap
    const nodes = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => d.data.color)
        .attr("stroke", "#fff");

    nodes.append("text")
        .attr("x", 3)
        .attr("y", 13)
        .text(d => `${d.data.color}: ${d.data.totalCarat.toFixed(2)}`)
        .attr("font-size", "10px")
        .attr("fill", "#000");
}
/*
function displayData(decadeFilter = null, yOffset = 0) {
    const margin = { top: 60, right: 40, bottom: 60, left: 20 }; // Increased right margin

    d3.select('#visual-container').selectAll('svg').remove();

    // Initial dimensions
    const container = d3.select('#visual-container').node();
    const initialWidth = container.clientWidth - margin.left - margin.right;
    const initialHeight = container.clientHeight - margin.top - margin.bottom;

    // Function to update the size and transformations of visSVG and g elements
    function updateSVGSize() {
        const container = d3.select('#visual-container').node();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const svgWidth = containerWidth - margin.left - margin.right;
        const svgHeight = containerHeight - margin.top - margin.bottom;

        const visSVG = d3.select('#visual-container').select('svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);

        const scaleX = svgWidth / initialWidth;
        const scaleY = svgHeight / initialHeight;

        visSVG.selectAll('g')
            .attr('transform', `translate(${margin.left},${margin.top + yOffset}) scale(${scaleX}, ${scaleY})`);

        // Update the slider width to match the visSVG width
        d3.select('#decadeSlider').style('width', `${svgWidth}px`);
        d3.select('#tickmarks').style('width', `${svgWidth * 1.02}px`);
    }

    // Create the SVG and g elements
    const visSVG = d3.select('#visual-container').append('svg')
        .attr('width', initialWidth + margin.right) // Adjust width to account for right margin
        .attr('height', initialHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top + yOffset})`);

    // Call the function initially to set the size
    updateSVGSize();

    // Add an event listener for window resize
    window.addEventListener('resize', updateSVGSize);

    const byDecade = d3.group(allQuilts, d => d.decade);

    const nodes = decadeFilter ? Array.from(byDecade.values()).flat().filter(d => d.decade === decadeFilter) : Array.from(byDecade.values()).flat();

    console.log('Nodes data:', nodes);

    const dataByDecade = d3.group(nodes, d => d.decade);

    let decades = Array.from(dataByDecade.keys());
    decades.sort((a, b) => a - b); // Ensure the decades are sorted in ascending order

    // Add "All Years" as the first option
    decades.unshift("All Years");

    const minDecade = d3.min(decades);
    const maxDecade = d3.max(decades);

    const colorScale = d3.scaleSequential()
        .domain([minDecade, maxDecade])
        .interpolator(d3.interpolateOranges);

    const maxQWidth = d3.max(nodes, d => d.qwidth);
    const maxQHeight = d3.max(nodes, d => d.qheight);

    function getLuminance(color) {
        const rgb = d3.color(color).rgb();
        return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    }

    let isSliderActive = false;

    const horizontalMargin = 2; // Horizontal margin between images
    const verticalMargin = 5; // Vertical margin between images

    function updateLayout(filteredNodes) {
        // Remove any existing SVG elements
        d3.select('#visual-container').selectAll('svg').remove();

        // Define margins and dimensions
        const margin = { top: 20, right: 40, bottom: 60, left: 40 }; // Increased right margin
        const container = d3.select('#visual-container').node();
        const svgWidth = container.clientWidth - margin.left - margin.right;
        const svgHeight = container.clientHeight - margin.top - margin.bottom;

        // Calculate the number of rows and columns needed
        const numImages = filteredNodes.length;
        const numCols = Math.ceil(Math.sqrt(numImages * svgWidth / svgHeight));
        const numRows = Math.ceil(numImages / numCols);

        // Calculate the width and height of each image
        const imageWidth = (svgWidth - (numCols - 1) * horizontalMargin) / numCols;
        const imageHeight = (svgHeight - (numRows - 1) * verticalMargin) / numRows;

        // Create the SVG element
        const visSVG = d3.select('#visual-container').append('svg')
            .attr('width', svgWidth + margin.right) // Adjust width to account for right margin
            .attr('height', svgHeight + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top + yOffset})`);

        // Calculate positions for the grid layout
        filteredNodes.forEach((d, i) => {
            d.x = (i % numCols) * (imageWidth + horizontalMargin);
            d.y = Math.floor(i / numCols) * (imageHeight + verticalMargin);
        });

        // Add images with aspect ratio maintained
        const images = visSVG.selectAll('image')
            .data(filteredNodes, d => d.id)
            .join('image')
            .attr('xlink:href', d => d.imgLink)
            .attr('width', d => imageWidth)
            .attr('height', d => imageHeight)
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('preserveAspectRatio', 'xMidYMid meet') // Maintain aspect ratio
            .style('transform-origin', function (d) {
                return `${d.x}px ${d.y}px`;
            }) // Set transform origin to center of the rectangle
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('transform', 'scale(1.05)'); // Scale around the center
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('transform', 'scale(1)'); // Reset scale
            })
            .on('click', function (event, d) {
                const tooltip = d3.select('#tooltip');
                const isVisible = tooltip.style('display') === 'block';

                if (isVisible) {
                    tooltip.style('display', 'none');
                } else {
                    const container = d3.select('#visual-container').node();
                    const containerWidth = container.clientWidth;
                    const containerHeight = container.clientHeight;

                    tooltip
                        .style('left', `${containerWidth + 20}px`) // Position to the right of visSVG
                        .style('top', `350px`)
                        .style('display', 'block')
                        .html(`
                            <img src="${d.imgLink}" alt="${d.title}" style="width: 100%; height: auto;"><br>
                            <strong> ${d.title} </strong><br>
                            <strong>Size:</strong> ${d.size}<br>
                            <strong>Decade:</strong> ${d.decade}<br>
                            <a href="${d.link}" target="_blank">For more info, click here</a>
                        `);
                }
            });
    }

    const slider = d3.select('#decadeSlider');
    const decadeValue = d3.select('#decadeValue');

    // Update the slider to include only available decades
    slider.attr('min', 0)
        .attr('max', decades.length - 1)
        .attr('step', 1); // Step is 1 to move through the indices

    // Generate tick marks for each decade
    const tickmarks = d3.select('#tickmarks');
    tickmarks.selectAll('span')
        .data(decades)
        .enter()
        .append('span')
        .text(d => d);

    // Add event listener to the slider
    slider.on('input', function () {
        isSliderActive = true;
        const selectedIndex = +this.value;
        const selectedDecade = decades[selectedIndex];
        updateDecade(selectedDecade);
    });

    function updateDecade(decade) {
        // Update the displayed decade value
        if (decade === "All Years") {
            decadeValue.text('All Years');
        } else {
            decadeValue.text(decade);
        }

        // Filter nodes based on the selected decade
        const filteredNodes = decade === "All Years" ? nodes : nodes.filter(d => d.decade === decade);
        updateLayout(filteredNodes);
    }

    // Call updateLayout initially and on window resize
    updateLayout(nodes);
    d3.select(window).on('resize', () => updateLayout(nodes));
}*/