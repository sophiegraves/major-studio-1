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

const search = 'quilt AND unit_code:"SAAM" AND title_sort:"quilt" AND (object_type:"Quilts" OR objectType:"quilt")';

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


  // we've encountered that some places have data others don't

  const id = objectData.id ?? 'N/A';
  const title = objectData.title ?? 'N/A';
  const date = objectData.content?.freetext?.date?.[0].content ?? 'Unknown';
  const link = objectData.content?.descriptiveNonRepeating?.guid ?? 'N/A';
  //const decade = objectData.content?.indexedStructured?.date[0] ?? 'Unknown'


  let decade = "";
  if (objectData.content.indexedStructured.date) {
    decade = objectData?.content?.indexedStructured?.date[0].split("s")[0];
  } else {
    decade = 'Unknown'
  }

  let size = "";
  //const last = objectData.content.freetext.physicalDescription.slice(-1).pop();
  if (objectData.content.freetext.physicalDescription) {
    //size = objectData?.content?.freetext?.physicalDescription.slice(-1).pop().content.split(". (")[0].split("overall: ")[1];
    size = objectData?.content?.freetext?.physicalDescription.slice(-1).pop().content;
  } else {
    size = 'Unknown'
  }


  let qwidth = "";
  if (size) {
    //qwidth = objectData?.content?.freetext?.physicalDescription.slice(-1).pop().content.split(" in")[0].split("overall: ")[1];
    qwidth = size.split(" in.")[0].split(" ")[0];
  } else {
    qwidth = 'Unknown'
  }


  // Extract height 
  /*
  let qheight = "";
  if (size !== 'Unknown' && size.includes("x") && size.includes("in")) {
    qheight = size.split("x")[1].split("in")[0].trim();
  } else {
    if (size !== size.includes("x") && size.includes("in")) {
      qheight = size.split(" ")[2].split("in")[0].trim();
    }
  } */

  let qheight = "";
  if (size !== 'Unknown' && size.includes("x")) {
    qheight = size.split("x")[1].split("in")[0].trim();
  } else if (size !== 'Unknown' && size.includes("×")) {
    // Split the string by "×" and take the second part
    const heightPart = size.split("×")[1].trim();
    // Split the second part by "in" and take the first part, then trim any whitespace
    qheight = heightPart.split("in")[0].trim();
  } else {
    qheight = 'Unknown';
  }

  let qheightint = ""
  if (qheight != 'Unknown' && qheight != null && qheight.includes("/")) {
    cleanheightint = qheight.split(" ")[0];
    qheightint = Math.round(cleanheightint)
  } else if (qheight != 'Unknown') {
    qheightint = Math.round(qheight);
  } else {
    qheightint = 'Unknown';
  }



  /*let qheight = "";
  if (size.includes("×") && size.includes("in")) {
    // Split the string by "×" and take the second part
    const heightPart = size.split("×")[1].trim();
    // Split the second part by "in" and take the first part, then trim any whitespace
    qheight = heightPart.split("in")[0].trim();
  } else if (size.includes("x") && size.includes("in")) {
    qheight = size.split("x")[1].split("in")[0].trim();;
  } else { qheight = 'Unknown'; }
 
  let qheightint = ""
  if (qheight != 'Unknown') {
    qheightint = Math.round(qheight)
  } else {
    qheightint = 'Unknown' */

  let qwidthint = ""
  if (qwidth != 'Unknown') {
    qwidthint = Math.round(qwidth)
  } else {
    qwidthint = null
  }

  let decadeint = ""
  if (decade != 'Unknown') {
    decade = Math.round(decade)
  } else {
    decade = null
  }

  let imgLink = ""
  if (objectData.content.descriptiveNonRepeating.online_media) {
    imgLink = objectData?.content?.descriptiveNonRepeating?.online_media?.media.slice(-1).pop().content;
  } else {
    imgLink = null
  }

  const existingElement = myArray.find((e) => e.id === objectData.id)
  if (!existingElement) {
    myArray.push({
      id: objectData.id,
      title: objectData.title,
      link: link,
      decade: decade,
      date: date,
      size: size,
      widthstr: qwidth,
      heightstr: qheight,
      qwidth: qwidthint,
      qheight: qheightint,
      imgLink: imgLink,
      //date: objectData.content.freetext.date[0].content,
      type: objectData.content.indexedStructured.object_type[0],
      //location: objectData.content.freetext.setName[1].content,
    })
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
