
// GENERAL

$('[data-toggle="tooltip"]').tooltip();

// MAPS

// ex.
// https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Australia&inputtype=textquery&fields=formatted_address,geometry&key=AIzaSyDjqR838ld_cLypsYIPLOOyYfYvmY05y4Y

$(".section-container").parent().removeClass("container").addClass("container-fluid");

$('#index-form').on('submit', function(e){
  e.preventDefault();

  const csrftoken = $(this).find('input[type="hidden"]').val();
  function csrfSafeMethod(method) {
      return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  $.ajaxSetup({
      beforeSend: function(xhr, settings) {
          if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
              xhr.setRequestHeader("X-CSRFToken", csrftoken);
          }
      }
  });

  $.ajax({
    url : urlPost,
    type : "POST",
    data : { 
      country : $('#id_country').val(),
      phase : $('#id_phase').val(),
      csrfmiddlewaretoken: csrftoken
      }
    })
    .done(function(json) {
        projects = JSON.parse(json.projects);
        addMarkers(projects);
    })
    .fail(function(xhr,msg,err) {
    })

});

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

  addMarkers(projects);
};

// clear current google map's markers to insert new ones 
function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  }
  markers = new Array();
}

function addMarkers(projects) {
  clearMarkers();

  const phaseDictColours = {
    "UD": "blue", "UC": "green", "RTB": "yellow" , "COD": "purple"
  }

  projects = projects.sort((a, b) => (a.fields.country > b.fields.country) ? 1 : -1)
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

    // Set Market Clusterer if any
    setTimeout(MarketCluster(i,j), 1);
    
    // zoom to country place if single country is selected
    onPlaceChanged(countryLatLng, $('#id_country').val());
    
    // build Info Content below map

    // drop marker if not a Cluster
    if (i>0 && i+1 < projects.length) {
      if ((projects[i].fields.country != projects[i-1].fields.country
        ) && (projects[i].fields.country != projects[i+1].fields.country)) {
        setTimeout(dropMarker(i), i * 100);
      }
    }
    
  }
  return;
}

function MarketCluster(i,j) {
  if (i > 0 && i+1 < projects.length) {
    if (projects[i].fields.country != projects[i+1].fields.country) {
      let markerCluster = new MarkerClusterer(map, markers.slice(j,i+1),
      {
        maxZoom: 10,
        averageCenter: true,
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
      }
      )
    }
  }
  return;
}

function onPlaceChanged(countryLatLng, filterCountry) {
  if (filterCountry != "") {
    map.panTo({
      "lat": parseFloat(countryLatLng[0].fields.latitude),
      "lng": parseFloat(countryLatLng[0].fields.longitude)
    });
    map.setZoom(5);
  } else {
    map.setCenter({ "lat": 39.074208, "lng": 21.824312 });
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