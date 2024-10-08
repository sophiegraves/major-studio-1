// Smithsonian API example code
// check API documentation for search here: http://edan.si.edu/openaccess/apidocs/#api-search-search
// Using this data set https://collections.si.edu/search/results.htm?q=Flowers&view=grid&fq=data_source%3A%22Cooper+Hewitt%2C+Smithsonian+Design+Museum%22&fq=online_media_type%3A%22Images%22&media.CC0=true&fq=object_type:%22Embroidery+%28visual+works%29%22

// put your API key here;
const apiKey = "jb5mjWwOfmiovVL6pYwcLpXgTFZpgbqvlNoEuLLv";

// search base URL
const searchBaseURL = "https://api.si.edu/openaccess/api/v1.0/search";

// constructing the initial search query
// const search =  'mask AND unit_code:"FSG"';
//const search = 'title_sort:"UNIDENTIFIED WOMAN"ANDunit_code:"NPG"ANDcontent.indexedStructured.usage_flag[0]:"Unidentified Woman"';
//const search = 'quilt AND unit_code:"NMAH" AND title_sort:"quilt" AND object_type:"Quilts"';

const search = 'gem AND unit_code:"NMNHMINSCI" AND topic:"Mineralogy"';

let specimancount = []

// array that we will write into
let myArray = [];

// string that will hold the stringified JSON data
let jsonString = '';

// search: fetches an array of terms based on term category
function fetchSearchData(searchTerm) {
  let url = searchBaseURL + "?api_key=" + apiKey + "&q=" + searchTerm;
  console.log(url);
  window
    .fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log(data)

      // constructing search queries to get all the rows of data
      // you can change the page size
      let pageSize = 1000;
      let numberOfQueries = Math.ceil(data.response.rowCount / pageSize);
      console.log(numberOfQueries)
      for (let i = 0; i < numberOfQueries; i++) {
        // making sure that our last query calls for the exact number of rows
        if (i == (numberOfQueries - 1)) {
          searchAllURL = url + `&start=${i * pageSize}&rows=${data.response.rowCount - (i * pageSize)}`;
        } else {
          searchAllURL = url + `&start=${i * pageSize}&rows=${pageSize}`;
        }
        console.log(searchAllURL)
        fetchAllData(searchAllURL);

      }
    })
    .catch(error => {
      console.log(error);
    })
}

// fetching all the data listed under our search and pushing them all into our custom array
function fetchAllData(url) {
  window
    .fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log(data)

      data.response.rows.forEach(function (n) {
        addObject(n);
      });
      jsonString = JSON.stringify(myArray);
      console.log(myArray);
    })
    .catch(error => {
      console.log(error)
    })

}

// create your own array with just the data you need
function addObject(objectData) {

  if (objectData.content.freetext.notes) {
    specimancount = objectData?.content?.freetext?.notes.slice(-1).pop().content;
  } else {
    specimancount = null
  }
  // we've encountered that some places have data others don't

  const id = objectData.id ?? 'N/A';
  const title = objectData.title ?? 'N/A';
  const link = objectData.content?.descriptiveNonRepeating?.guid ?? 'N/A';


  // Extract carat weight
  let carat = "";
  if (objectData.content.freetext.physicalDescription) {
    for (let item of objectData.content.freetext.physicalDescription) {
      if (item.label === "Weight") {
        carat = item.content;
        break; // Exit loop once the carat weight is found
      } else { carat = "Unknown" }
    }
  }


  // Extract gem type
  let type = "";
  if (objectData.content.indexedStructured.scientific_name) {
    type = objectData.content.indexedStructured.scientific_name[0].split(" ")[0];
  }


  // Extract color information
  if (objectData.content.freetext.physicalDescription) {
    for (let item of objectData.content.freetext.physicalDescription) {
      if (item.label === "Color") {
        color = item.content.trim() ? item.content : "Unknown";
        break; // Exit loop once the color is found
      }
    }
  };


  let imgLink = ""
  if (objectData.content.descriptiveNonRepeating.online_media) {
    imgLink = objectData?.content?.descriptiveNonRepeating?.online_media?.media.slice(-1).pop().content;
  } else {
    imgLink = null
  }

  // Define lists of common shades and hues
  const shades = ["dark", "medium", "light", "med"];
  const hues = ["blue", "green", "red", "yellow", "orange", "purple", "pink", "brown", "black", "white", "gray", "violet", "colorless", "purpleblue", "yellowgreen"];
  const saturation = ["slightly", "very", "extremely", "lightly"];
  const modifiers = ["yellowish", "reddish", "bluish", "blueish", "greenish", "brownish", "grayish", "pinkish", "purplish", "orangish"];
  let saturationMultiplier = 1;

  // Define a mapping of shades to their numeric values
  const shadeValues = {
    "dark": 5,
    "medium": 0,
    "med": 0,
    "light": -5
  };

  const saturationMultipliers = {
    "slightly": 0.8,
    "lightly": 0.8,
    "very": 1.2,
    "extremely": 1.3
  };




  // Function to classify color descriptors
  function classifyColor(color) {
    const colorWords = color.toLowerCase().replace(/\//g, " ").split(" ");
    const colorShades = [];
    const colorHues = [];
    const colorSaturation = [];
    const colorModifiers = [];
    let shadeSum = 0;
    let shadeCount = 0;
    let saturationMultiplier = 1;

    colorWords.forEach(word => {
      if (shades.includes(word)) {
        colorShades.push(word);
        shadeSum += shadeValues[word] || 0; // Add the numeric value of the shade
        shadeCount++;
      } if (hues.includes(word)) {
        colorHues.push(word);
      } if (saturation.includes(word)) {
        colorSaturation.push(word);
        saturationMultiplier = saturationMultipliers[word] || 1; // Set the saturation multiplier
      }
      if (modifiers.includes(word)) {
        colorModifiers.push(word);
      }
    })
      ;

    const averageShadeValue = shadeCount > 0 ? shadeSum / shadeCount : 0; // Calculate average
    const adjustedShadeValue = averageShadeValue * saturationMultiplier; // Adjust by saturation multiplier


    return {
      shades: colorShades,
      hues: colorHues,
      saturation: colorSaturation,
      modifiers: colorModifiers,
      adjustedShadeValue: adjustedShadeValue
    };
  }

  // Function to extract numeric value from carat string
  function extractCaratValue(carat) {
    const match = carat.match(/[\d.]+/); // Match digits and decimal points
    return match ? parseFloat(match[0]) : null; // Convert to float if match found
  }

  //no duplicates
  const existingElement = myArray.find((e) => e.id === objectData.id)
  if (!existingElement) {
    //only single specimans
    if (specimancount == "1")
      if (color != "Unknown") {
        if (carat != "Unknown") {
          // if (imgLink != null) {
          if (objectData.content.indexedStructured.topic[0] = "Mineralogy") {
            const classifiedColor = classifyColor(color);
            const numericCarat = extractCaratValue(carat);
            myArray.push({
              id: objectData.id,
              title: objectData.title,
              type: type,
              color: color,
              imgLink: imgLink,
              link: objectData.content.descriptiveNonRepeating.guid,
              specimanCount: specimancount,
              carat: carat,
              numericCarat: numericCarat,
              shades: classifiedColor.shades,
              hues: classifiedColor.hues,
              saturation: classifiedColor.saturation,
              modifiers: classifiedColor.modifiers,
              shadeValue: classifiedColor.adjustedShadeValue,
            })
          }
        }
      }
  }
}




fetchSearchData(search);


//---------------------------UNIT CODES------------------------------
//type: objectData.content.freetext.objectType[0].content
// ACAH: Archives Center, National Museum of American History
// ACM: Anacostia Community Museum
// CFCHFOLKLIFE: Smithsonian Center for Folklife and Cultural Heritage
// CHNDM: Cooper-Hewitt, National Design Museum
// FBR: Smithsonian Field Book Project
// FSA: Freer Gallery of Art and Arthur M. Sackler Gallery Archives
// FSG: Freer Gallery of Art and Arthur M. Sackler Gallery
// HAC: Smithsonian Gardens
// HMSG: Hirshhorn Museum and Sculpture Garden
// HSFA: Human Studies Film Archives
// NAA: National Anthropological Archives
// NASM: National Air and Space Museum
// NMAAHC: National Museum of African American History and Culture
// NMAfA: Smithsonian National Museum of African Art
// NMAH: Smithsonian National Museum of American History
// NMAI: National Museum of the American Indian
// NMNHANTHRO: NMNH - Anthropology Dept.
// NMNHBIRDS: NMNH - Vertebrate Zoology - Birds Division
// NMNHBOTANY: NMNH - Botany Dept.
// NMNHEDUCATION: NMNH - Education & Outreach
// NMNHENTO: NMNH - Entomology Dept.
// NMNHFISHES: NMNH - Vertebrate Zoology - Fishes Division
// NMNHHERPS: NMNH - Vertebrate Zoology - Herpetology Division
// NMNHINV: NMNH - Invertebrate Zoology Dept.
// NMNHMAMMALS: NMNH - Vertebrate Zoology - Mammals Division
// NMNHMINSCI: NMNH - Mineral Sciences Dept.
// NMNHPALEO: NMNH - Paleobiology Dept.
// NPG: National Portrait Gallery
// NPM: National Postal Museum
// SAAM: Smithsonian American Art Museum
// SI: Smithsonian Institution, Digitization Program Office
// SIA: Smithsonian Institution Archives
// SIL: Smithsonian Libraries*/
