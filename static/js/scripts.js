
// GENERAL

$('[data-toggle="tooltip"]').tooltip();

// MAPS

$(".section-container").parent().removeClass("container").addClass("container-fluid");

function addWorldIcon(filterCountry) {
  if (filterCountry != "") {
    $('#flag_id_country').addClass('d-none').removeClass('d-none');
    $('#flag_id_country').next().remove();
  } else {
    $('#flag_id_country').removeClass('d-none').addClass('d-none');
    $('#flag_id_country').after('<i class="fas fa-1x fa-globe" style="margin:6px 4px 0;"></i>');
  }
}

// Country On Change Handling
$('#index-form #id_country').on('change', function(e){
  e.preventDefault();
  // insert World Icon if All Countries is Selected
  addWorldIcon($(this).val());
  // zoom to country place if single country is selected
  onPlaceChanged($(this).val());
});

// Font Weight to 100 the disabled phase filter
$('#index-form #id_phase').css({'font-weight': 100});

function initMap() {

  // Insert Map
  const options = {
      zoom: 1,
      center: { // Mediterranean Sea
          "lat": 34.5531,
          "lng": 18.0480
      },
      mapTypeControl: false,
      panControl: false,
      zoomControl: false,
      streetViewControl: false,
      componentRestrictions: { 'country': [] }
  }

  map = new google.maps.Map(document.getElementById("map"), options);

  //add Markers
  addMarkers(projects);

  // insert World Icon if All Countries is Selected
  addWorldIcon($('#id_country').val());

  // zoom to country place if single country is selected
  onPlaceChanged($('#id_country').val());
};

function MarketClusterClearRemain() {
  const patt = /markerclusterer/i;
  const mcRemainders = $("#map div").filter(function() {
    if ($(this).css("background-image").match(patt)) {
      $(this).remove();
    }
  });
  return;
}

// clear current google map's markers to insert new ones 
function clearMarkers() {
  infowindow = new google.maps.InfoWindow();
  infowindow.close();

  const markerCluster = new MarkerClusterer(map, markers, {
    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
  });

  for (let it in markers) {
    markers[it].setVisible(false);
  }
  markerCluster.repaint();

  markerCluster.removeMarkers(markerCluster.getMarkers());

  for (let i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  }

  markers.length = 0;

  markerCluster.clearMarkers();

  MarketClusterClearRemain();
}

function addMarkers(projects) {
  clearMarkers();

  const phaseDictColours = {
    "UD": "blue", "UC": "green", "RTB": "yellow" , "COD": "purple"
  }

  let counterLat = 0; counterLng = 0; let j=0;

  // add markers and info window on the map
  for (let i = 0; i < projects.length; i++) {

    if (i>0 && projects[i].fields.country != projects[i-1].fields.country) {
      counterLat = 0; counterLng = 0; j = i;
    } else {
      counterLat+= 0.032; counterLng+= 0.0091;
    }

    let countryLatLng = projectsLatLng.filter(
      obj => obj.fields.name  ===  projects[i].fields.country
    );

    let markerIcon = "http://maps.google.com/mapfiles/ms/icons/";
    markerIcon += phaseDictColours[projects[i].fields.phase] + "-dot.png";
    
    let locationInfowindow = new google.maps.InfoWindow({
      content: genHtmlContent(i),
    });

    let marker = new google.maps.Marker({
      position: {
        "lat": parseFloat(countryLatLng[0].fields.latitude) + counterLat,
        "lng": parseFloat(countryLatLng[0].fields.longitude) + counterLng
      },
      animation: google.maps.Animation.DROP,
      icon: markerIcon,
      visible: true,
      infowindow: locationInfowindow
     });
    
    // insert marker to array of markers
    markers.push(marker);
    
    // hook info window and close all opened ones
    google.maps.event.addListener(marker, 'click', function() {
      hideAllInfoWindows(map);
      this.infowindow.open(map, this);
    });

    // Set Market Clusterer
    if (projects[i].fields.country != projects[i+(i+1==projects.length?0:1)].fields.country) {
        setTimeout(MarketCluster(i,j), 1);

        // set the market clusterer to a drop marker instead if only one country project
        if (projects[i].fields.country != projects[i-1].fields.country) {
          setTimeout(dropMarker(i), i * 100);
        };
    }

    // build Info Content below map
    
  }
  return;
}

function MarketCluster(i,j) {
  let markerCluster = new MarkerClusterer(map, markers.slice(j,i+1),
    {
      maxZoom: 10,
      averageCenter: true,
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    }
    )
  return;
}

function onPlaceChanged(filterCountry) {
  if (filterCountry != "") {
    const countryLatLng = projectsLatLng.filter(
      obj => obj.fields.name  ===  filterCountry
    );
    map.panTo({
      "lat": parseFloat(countryLatLng[0].fields.latitude),
      "lng": parseFloat(countryLatLng[0].fields.longitude)
    });
    map.setZoom(6);
  } else {
    map.setCenter({ "lat": 34.5531, "lng": 18.0480 });
    map.setZoom(3);
  }
}

function genHtmlContent(i) {
  
  const contentstring = "<table>" +
  "<tbody>" + 
  "<tr>" + 
  "<td>" + "Phase" + "</td>" +
  "<td class=" + '"px-1"' + ">:</td>" +
  "<td>" + projects[i].fields.phase + "</td>" +
  "</tr>" + 
  "<tr>" + 
  "<td>" + "MW" + "</td>" +
  "<td class=" + '"px-1"' + ">:</td>" +
  "<td>" + projects[i].fields.mw + "</td>" +
  "</tr>" +
  "<tr>" + 
  "<td>" + "Budget Revenue" + "</td>" +
  "<td class=" + '"px-1"' + ">:</td>" +
  "<td>" + projects[i].fields.budget_revenue + "</td>" +
  "</tr>" +
  "<tr>" + 
  "<td>" + "Budget Cogs" + "</td>" +
  "<td class=" + '"px-1"' + ">:</td>" +
  "<td>" + projects[i].fields.budget_cogs + "</td>" +
  "</tr>" +
  "<tr>" + 
  "<td>" + "Cash Outflow No Vat" + "</td>" +
  "<td class=" + '"px-1"' + ">:</td>" +
  "<td>" + projects[i].fields.cash_out_no_vat + "</td>" +
  "</tr>" +    
  "<tr>" + 
  "<td>" + "% of Completion" + "</td>" +
  "<td class=" + '"px-1"' + ">:</td>" +
  "<td>" + projects[i].fields.pct_of_completion + "</td>" +
  "</tr>" +       
  "</tbody>" +
  "<table/>";

  return contentstring;
}

function hideAllInfoWindows(map) {
  markers.forEach(function(marker) {
    marker.infowindow.close(map, marker);
  });
}

function dropMarker(i) {
  return function() {
    markers[i].setMap(map);
  };
}